import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { dispatchWebhooks } from '../_shared/logistics.ts';
import { resolveTenantActor } from '../_shared/access.ts';

// Every privileged shipment transition runs here, never in the browser: the
// caller's tenant membership and role are resolved server-side, the delivery
// code is verified on the server, and only then is the record written. A driver
// can therefore operate their own stops and nothing else.
const MANAGE_ROLES = ['tenant_admin', 'hub_supervisor', 'dispatcher'];
const BILLING_ROLES = ['tenant_admin', 'dispatcher', 'billing_manager'];
// Collecting cash is a field operation; settling it with the merchant is finance.
const COD_COLLECT_ROLES = ['tenant_admin', 'billing_manager', 'dispatcher'];
const COD_SETTLE_ROLES = ['tenant_admin', 'billing_manager'];
const CLOSED_STATUSES = ['delivered', 'cancelled', 'returned'];

// The lifecycle is a state machine, so a parcel can never skip ahead or slide
// backwards.
const STATUS_FLOW = {
  created: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'at_hub', 'cancelled'],
  in_transit: ['at_hub', 'out_for_delivery', 'failed'],
  at_hub: ['in_transit', 'out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  failed: ['out_for_delivery', 'returned'],
  returned: [],
  delivered: [],
  cancelled: [],
};

const text = (value, max = 200) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);

// A scan is only geotagged when the phone really reported a usable fix.
const coords = (body) => {
  const lat = Number(body && body.lat);
  const lng = Number(body && body.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
};

const allows = (actor, roles) => actor.role === 'platform_admin' || roles.includes(actor.role);

const summary = (shipment) => ({
  id: shipment.id,
  tracking_number: shipment.tracking_number,
  status: shipment.status,
  payment_status: shipment.payment_status,
  assigned_driver_email: shipment.assigned_driver_email || '',
});

// Compared in constant time so the delivery code cannot be probed digit by digit.
function sameCode(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

const eventTypeFor = (status) => {
  if (status === 'delivered') return 'delivered';
  if (status === 'failed') return 'ndr';
  if (status === 'out_for_delivery') return 'out_for_delivery';
  if (status === 'at_hub') return 'scan_in';
  return 'in_transit';
};

async function logEvent(service, shipment, options) {
  try {
    await service.entities.ShipmentEvent.create({
      tenant_id: shipment.tenant_id,
      shipment_id: shipment.id,
      tracking_number: shipment.tracking_number,
      status: options.status || shipment.status,
      event_type: options.eventType || 'note',
      location: [shipment.receiver_city, shipment.receiver_country].filter(Boolean).join(', '),
      hub_id: shipment.current_hub_id || '',
      driver_email: options.actorEmail || '',
      ...(options.position ? { lat: options.position.lat, lng: options.position.lng } : {}),
      note: options.note || '',
      occurred_at: new Date().toISOString(),
      // Internal cash notes stay out of the customer-facing tracking timeline.
      visible_public: options.visiblePublic !== false,
      member_emails: shipment.member_emails || [],
    });
  } catch {
    // The journey log must never block an operation.
  }
}

async function markCollected(service, shipment, actorEmail, stamp) {
  if (shipment.payment_mode !== 'cod' || !(Number(shipment.cod_amount) > 0)) return;
  try {
    const rows = await service.entities.CodEntry.filter({ shipment_id: shipment.id });
    const entries = Array.isArray(rows) ? rows : rows.items || [];
    if (!entries.length) return;
    await service.entities.CodEntry.update(entries[0].id, {
      status: 'collected',
      collected_at: stamp,
      driver_email: actorEmail,
    });
  } catch {
    // Cash reconciliation lives in the COD ledger; it never blocks the POD.
  }
}

async function freeDriver(service, actor) {
  if (!actor || !actor.member) return;
  try {
    await service.entities.TeamMember.update(actor.member.id, { availability: 'available' });
  } catch {
    // Availability is a dispatch convenience only.
  }
}

async function announce(service, shipment, event) {
  try {
    await dispatchWebhooks(service, {
      tenant_id: shipment.tenant_id,
      event,
      payload: {
        tracking_number: shipment.tracking_number,
        waybill_number: shipment.waybill_number,
        status: shipment.status,
        service_type: shipment.service_type,
        payment_mode: shipment.payment_mode,
        cod_amount: shipment.cod_amount,
        currency: shipment.currency,
        merchant_ref: shipment.merchant_ref,
        driver_email: shipment.assigned_driver_email || '',
        receiver_city: shipment.receiver_city,
        receiver_country: shipment.receiver_country,
        eta_date: shipment.eta_date,
        pod_at: shipment.pod_at || null,
        pod_recipient_name: shipment.pod_recipient_name || '',
        last_ndr_reason: shipment.last_ndr_reason || '',
        updated_at: new Date().toISOString(),
      },
      member_emails: shipment.member_emails || [],
      payload_ref: shipment.tracking_number,
    });
  } catch {
    // Outbound notifications never block the operation.
  }
}

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });

    const service = client.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = text(body.action, 30).toLowerCase();
    const shipmentId = text(body.shipment_id, 40);
    if (!shipmentId) return Response.json({ error: 'shipment_id is required', code: 'missing_shipment' });

    const shipment = await service.entities.Shipment.get(shipmentId).catch(() => null);
    if (!shipment) return Response.json({ error: 'Shipment not found', code: 'not_found' }, { status: 404 });

    // The tenant comes from the record itself, never from the caller's payload.
    const actor = await resolveTenantActor(service, user, shipment.tenant_id);
    if (actor.error) return Response.json({ error: actor.error, code: actor.code }, { status: actor.status });

    const isDriver = actor.role === 'driver';
    if (isDriver && shipment.assigned_driver_email && shipment.assigned_driver_email !== user.email) {
      return Response.json({ error: 'This stop is assigned to another driver', code: 'not_assigned' }, { status: 403 });
    }

    if (action === 'pod') {
      if (!isDriver && !allows(actor, MANAGE_ROLES)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }
      if (CLOSED_STATUSES.includes(shipment.status)) {
        return Response.json({ error: 'This shipment is already closed', code: 'closed' });
      }
      if (!sameCode(text(body.otp, 10), text(shipment.delivery_otp, 10))) {
        return Response.json({ error: 'Invalid delivery code', code: 'invalid_otp' });
      }
      const recipient = text(body.recipient, 120);
      if (!recipient) return Response.json({ error: 'Recipient name is required', code: 'missing_recipient' });
      const signature = String(body.signature || '');
      if (!signature.startsWith('data:image')) {
        return Response.json({ error: 'Recipient signature is required', code: 'missing_signature' });
      }
      const photoUri = text(body.photo_uri, 300);
      if (!photoUri) return Response.json({ error: 'A delivery photo is required', code: 'missing_photo' });

      const stamp = new Date().toISOString();
      const at = coords(body);
      const updated = await service.entities.Shipment.update(shipment.id, {
        status: 'delivered',
        pod_recipient_name: recipient,
        pod_signature: signature,
        pod_photo_uri: photoUri,
        pod_at: stamp,
        // The door is where the parcel was last known to be.
        ...(at ? { current_lat: at.lat, current_lng: at.lng, last_gps_at: stamp } : {}),
        // Single use: a spent code can never open another delivery.
        delivery_otp: '',
      });

      await markCollected(service, updated, user.email, stamp);
      await logEvent(service, updated, {
        eventType: 'pod',
        status: 'delivered',
        note: `Proof of delivery · ${recipient}`,
        actorEmail: user.email,
        position: at,
      });
      await freeDriver(service, actor);
      await announce(service, updated, 'shipment.delivered');
      return Response.json({ ok: true, shipment: summary(updated) });
    }

    if (action === 'ndr') {
      if (!isDriver && !allows(actor, MANAGE_ROLES)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }
      if (CLOSED_STATUSES.includes(shipment.status)) {
        return Response.json({ error: 'This shipment is already closed', code: 'closed' });
      }
      const reason = text(body.reason, 60) || 'customer_unreachable';
      const at = coords(body);
      const updated = await service.entities.Shipment.update(shipment.id, {
        delivery_attempts: (Number(shipment.delivery_attempts) || 0) + 1,
        last_ndr_reason: reason,
        ...(at ? { current_lat: at.lat, current_lng: at.lng, last_gps_at: new Date().toISOString() } : {}),
      });
      await logEvent(service, updated, {
        eventType: 'ndr',
        status: updated.status,
        note: text(body.note, 200) || reason,
        actorEmail: user.email,
        position: at,
      });
      await freeDriver(service, actor);
      await announce(service, updated, 'shipment.failed');
      return Response.json({ ok: true, shipment: summary(updated) });
    }

    if (action === 'status') {
      if (!allows(actor, MANAGE_ROLES)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }
      const next = text(body.status, 20);
      const allowed = STATUS_FLOW[shipment.status] || [];
      if (!allowed.includes(next)) {
        return Response.json({
          error: `Cannot move a shipment from ${shipment.status} to ${next || 'nothing'}`,
          code: 'invalid_transition',
        });
      }
      const at = coords(body);
      const patch = {
        status: next,
        current_hub_id: body.hub_id !== undefined ? text(body.hub_id, 40) : shipment.current_hub_id || '',
        ...(at ? { current_lat: at.lat, current_lng: at.lng, last_gps_at: new Date().toISOString() } : {}),
      };
      const updated = await service.entities.Shipment.update(shipment.id, patch);
      await logEvent(service, updated, {
        eventType: eventTypeFor(next),
        status: next,
        note: text(body.note, 200),
        actorEmail: user.email,
        position: at,
      });
      const event =
        next === 'delivered' ? 'shipment.delivered' : next === 'failed' ? 'shipment.failed' : 'shipment.status_changed';
      await announce(service, updated, event);
      return Response.json({ ok: true, shipment: summary(updated) });
    }

    if (action === 'assign') {
      if (!allows(actor, MANAGE_ROLES)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }
      const patch = {
        assigned_driver_email: text(body.driver_email, 160).toLowerCase(),
        destination_hub_id:
          body.destination_hub_id !== undefined
            ? text(body.destination_hub_id, 40)
            : shipment.destination_hub_id || '',
      };
      const updated = await service.entities.Shipment.update(shipment.id, patch);
      return Response.json({ ok: true, shipment: summary(updated) });
    }

    if (action === 'payment') {
      if (!allows(actor, BILLING_ROLES)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }
      const status = ['unpaid', 'awaiting_verification', 'paid', 'cod_pending'].includes(body.payment_status)
        ? body.payment_status
        : 'paid';
      const updated = await service.entities.Shipment.update(shipment.id, {
        payment_status: status,
        paid_at: status === 'paid' ? new Date().toISOString() : shipment.paid_at || '',
        payment_reference: text(body.payment_reference, 80) || shipment.payment_reference || '',
      });
      return Response.json({ ok: true, shipment: summary(updated) });
    }

    // Cash movement is money movement: only finance roles may settle or dispute a
    // COD entry, and a dispatcher only records what a driver handed over. The
    // ledger stage is checked on the server so a stale screen cannot skip ahead.
    if (action === 'cod') {
      const status = ['collected', 'settled', 'disputed'].includes(body.cod_status) ? body.cod_status : '';
      if (!status) {
        return Response.json({ error: 'cod_status must be collected, settled or disputed', code: 'invalid_cod_status' });
      }
      const allowedRoles = status === 'collected' ? COD_COLLECT_ROLES : COD_SETTLE_ROLES;
      if (!allows(actor, allowedRoles)) {
        return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
      }

      const rows = await service.entities.CodEntry.filter({
        shipment_id: shipment.id,
        tenant_id: shipment.tenant_id,
      });
      const entries = Array.isArray(rows) ? rows : rows.items || [];
      const entry = entries[0];
      if (!entry) return Response.json({ error: 'No cash entry for this shipment', code: 'not_found' }, { status: 404 });

      const expected = status === 'collected' ? 'pending' : 'collected';
      if (entry.status !== expected) {
        return Response.json(
          { error: `This cash entry is ${entry.status} and cannot become ${status}`, code: 'invalid_transition' }
        );
      }

      const stamp = new Date().toISOString();
      const patch = { status };
      if (status === 'collected') {
        patch.collected_at = stamp;
        patch.driver_email = entry.driver_email || shipment.assigned_driver_email || '';
      }
      if (status === 'settled') {
        patch.settled_at = stamp;
        patch.settled_by = user.email;
        patch.settlement_ref = text(body.settlement_ref, 40) || `ST-${Date.now().toString().slice(-6)}`;
      }
      if (status === 'disputed') {
        patch.settled_by = user.email;
        patch.notes = text(body.note, 200) || entry.notes || '';
      }

      const updated = await service.entities.CodEntry.update(entry.id, patch);
      await logEvent(service, shipment, {
        eventType: 'note',
        status: shipment.status,
        note: `COD ${status}${patch.settlement_ref ? ` · ${patch.settlement_ref}` : ''}`,
        actorEmail: user.email,
        visiblePublic: false,
      });

      return Response.json({
        ok: true,
        cod: {
          id: updated.id,
          status: updated.status,
          amount: updated.amount,
          currency: updated.currency,
          settlement_ref: updated.settlement_ref || '',
        },
      });
    }

    return Response.json({ error: 'Unsupported action', code: 'unsupported_action' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
