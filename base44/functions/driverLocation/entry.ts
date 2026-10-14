import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { resolveTenantActor } from '../../shared/access.ts';

// Live GPS. The driver app shares its position while on duty: this endpoint stores
// it on the driver's team member row (dispatch map) and on the parcel being
// carried (customer tracking page). Every write stays behind a membership check —
// a driver can only move their own position and their own assigned stops.

const MANAGE_ROLES = ['tenant_admin', 'hub_supervisor', 'dispatcher'];
const CLOSED_STATUSES = ['delivered', 'cancelled', 'returned'];
// A phone that pings faster than this would rewrite the same spot over and over.
const MIN_INTERVAL_MS = 15000;

const text = (value, max = 160) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);

const rowsOf = (result) => (Array.isArray(result) ? result : (result && result.items) || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return Response.json({ error: 'A valid latitude and longitude are required', code: 'invalid_position' });
    }
    const accuracy = Math.min(Math.max(Number(body.accuracy) || 0, 0), 100000);
    const stamp = new Date().toISOString();
    const shipmentId = text(body.shipment_id, 40);
    const statedTenant = text(body.tenant_id, 40);

    const members = rowsOf(await service.entities.TeamMember.filter({ email: user.email }, { limit: 10 }));
    const member =
      members.find((row) => (!statedTenant || row.tenant_id === statedTenant) && row.status !== 'suspended') ||
      members[0] ||
      null;

    if (!member && !shipmentId) {
      return Response.json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
    }

    if (member) {
      await service.entities.TeamMember.update(member.id, {
        last_lat: lat,
        last_lng: lng,
        last_seen: stamp,
      });
    }

    if (!shipmentId) {
      return Response.json({ ok: true, positioned: { lat, lng, accuracy }, stored_at: stamp, shipment: null });
    }

    const shipment = await service.entities.Shipment.get(shipmentId).catch(() => null);
    if (!shipment) return Response.json({ error: 'Shipment not found', code: 'not_found' }, { status: 404 });

    const actor = await resolveTenantActor(service, user, shipment.tenant_id);
    if (actor.error) return Response.json({ error: actor.error, code: actor.code }, { status: actor.status });

    const manages = actor.role === 'platform_admin' || MANAGE_ROLES.includes(actor.role);
    if (!manages && shipment.assigned_driver_email !== user.email) {
      return Response.json({ error: 'This stop is assigned to another driver', code: 'not_assigned' }, { status: 403 });
    }
    if (CLOSED_STATUSES.includes(shipment.status)) {
      return Response.json({ ok: true, skipped: 'closed', shipment: null });
    }

    const previous = shipment.last_gps_at ? new Date(shipment.last_gps_at).getTime() : 0;
    if (Number.isFinite(previous) && Date.now() - previous < MIN_INTERVAL_MS) {
      return Response.json({ ok: true, skipped: 'throttled', shipment: null });
    }

    await service.entities.Shipment.update(shipment.id, {
      current_lat: lat,
      current_lng: lng,
      last_gps_at: stamp,
      courier_name: shipment.courier_name || text(user.full_name || user.email, 120),
    });

    return Response.json({
      ok: true,
      stored_at: stamp,
      positioned: { lat, lng, accuracy },
      shipment: { id: shipment.id, tracking_number: shipment.tracking_number },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}