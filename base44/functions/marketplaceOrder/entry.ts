import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import {
  createShipmentRecord,
  deliverWebhook,
  findShipmentByRef,
  validateShipmentInput,
} from '../../shared/logistics.ts';

// Inbound marketplace bridge. A connected sales channel posts one of its orders
// to this endpoint with its connection token; the shipment is priced, numbered
// and registered server-side, then the tracking number goes back to the channel.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const service = base44.asServiceRole;

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const token = String(
      url.searchParams.get('token') || req.headers.get('x-marketplace-token') || body.token || ''
    ).trim();
    if (!token) return Response.json({ error: 'Missing connection token.' }, { status: 401 });

    const connections = await service.entities.MarketplaceConnection.filter({ inbound_token: token });
    const connection = connections[0];
    if (!connection) return Response.json({ error: 'Unknown connection token.' }, { status: 401 });
    if (connection.status !== 'connected') {
      return Response.json({ error: 'This marketplace connection is paused.' }, { status: 403 });
    }

    const tenant = await service.entities.Tenant.get(connection.tenant_id);
    if (!tenant || tenant.status !== 'active') {
      return Response.json({ error: 'Logistics agency account is not active.' }, { status: 403 });
    }

    const order = body.order && typeof body.order === 'object' ? body.order : body;
    const shipping =
      order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : {};

    // Pickup defaults to the agency's own warehouse when the channel only sends
    // the buyer's details.
    const payload = {
      ...order,
      merchant_ref: order.merchant_ref || order.order_id || order.order_number || order.reference || '',
      merchant_email: order.merchant_email || tenant.owner_email,
      description: order.description || order.items_summary || '',
      sender_name: order.sender_name || order.warehouse_name || tenant.name,
      sender_phone: order.sender_phone || order.warehouse_phone || tenant.phone || '',
      sender_city: order.sender_city || tenant.city || '',
      sender_country: order.sender_country || tenant.country || '',
      sender_address: order.sender_address || tenant.address || '',
      receiver_name: order.receiver_name || order.customer_name || shipping.name || '',
      receiver_phone: order.receiver_phone || order.customer_phone || shipping.phone || '',
      receiver_email: order.receiver_email || order.customer_email || '',
      receiver_address: order.receiver_address || shipping.address || shipping.street || '',
      receiver_city: order.receiver_city || shipping.city || '',
      receiver_country: order.receiver_country || shipping.country || '',
      weight_kg: Number(order.weight_kg) || Number(order.weight) || 1,
      service_type: order.service_type || connection.default_service_type || 'standard',
      payment_mode: order.payment_mode || connection.default_payment_mode || 'prepaid',
      cod_amount: Number(order.cod_amount) || 0,
      webhook_url: connection.webhook_url || '',
    };

    const invalid = validateShipmentInput({ ...payload, tenant_id: tenant.id });
    if (invalid) {
      waitUntil(
        service.entities.MarketplaceConnection.update(connection.id, {
          last_error: invalid,
          last_event_at: new Date().toISOString(),
        })
      );
      return Response.json({ error: invalid }, { status: 400 });
    }

    // The channel retries on timeout, so an order reference that is already
    // registered returns its parcel instead of duplicating the shipment.
    const existing = await findShipmentByRef(service, tenant.id, payload.merchant_ref);
    const shipment = existing || (await createShipmentRecord(service, tenant, payload, 'api'));
    const trackingUrl = `${req.headers.get('x-base44-app-url') || ''}/track?numbers=${shipment.tracking_number}`;

    if (!existing) {
      waitUntil(
        service.entities.MarketplaceConnection.update(connection.id, {
          orders_count: (Number(connection.orders_count) || 0) + 1,
          last_event_at: new Date().toISOString(),
          last_error: '',
        })
      );
    }

    const delivery = existing ? null : deliverWebhook(
      connection.webhook_url,
      'shipment.created',
      {
        marketplace: connection.marketplace,
        merchant_ref: shipment.merchant_ref,
        tracking_number: shipment.tracking_number,
        waybill_number: shipment.waybill_number,
        status: shipment.status,
        total_amount: shipment.total_amount,
        currency: shipment.currency,
        eta_date: shipment.eta_date,
        tracking_url: trackingUrl,
      },
      {
        service,
        tenant_id: connection.tenant_id,
        label: `${connection.marketplace} — ${connection.label || 'connection'}`,
        member_emails: shipment.member_emails || [],
        payload_ref: shipment.tracking_number,
      }
    );
    if (delivery) waitUntil(delivery);

    return Response.json({
      marketplace: connection.marketplace,
      merchant_ref: shipment.merchant_ref,
      duplicate: Boolean(existing),
      tracking_number: shipment.tracking_number,
      waybill_number: shipment.waybill_number,
      status: shipment.status,
      service_type: shipment.service_type,
      currency: shipment.currency,
      base_price: shipment.base_price,
      surcharge_total: shipment.surcharge_total,
      total_amount: shipment.total_amount,
      eta_date: shipment.eta_date,
      tracking_url: trackingUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}