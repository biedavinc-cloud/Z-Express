import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dispatchWebhooks } from '../../shared/logistics.ts';

// Called after a shipment changes state in the portal or the driver app, so the
// agency's own webhook endpoints receive the update in real time.
// POST { shipment_id, event?, previous_status? }
const EVENTS = ['shipment.status_changed', 'shipment.delivered', 'shipment.failed', 'pod.created'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shipmentId = String(body.shipment_id || '');
    if (!shipmentId) return Response.json({ error: 'shipment_id is required' }, { status: 400 });

    const service = base44.asServiceRole;
    const shipment = await service.entities.Shipment.get(shipmentId).catch(() => null);
    if (!shipment) return Response.json({ error: 'Shipment not found' }, { status: 404 });

    // Only someone who can already see this shipment may publish its events.
    const allowed =
      user.role === 'admin' ||
      (shipment.member_emails || []).includes(user.email) ||
      shipment.merchant_email === user.email;
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const event = EVENTS.includes(body.event) ? body.event : 'shipment.status_changed';

    const sent = await dispatchWebhooks(service, {
      tenant_id: shipment.tenant_id,
      event,
      payload: {
        tracking_number: shipment.tracking_number,
        waybill_number: shipment.waybill_number,
        status: shipment.status,
        previous_status: String(body.previous_status || ''),
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

    return Response.json({ ok: true, event, endpoints_notified: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}