import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { createShipmentRecord, validateShipmentInput } from '../_shared/logistics.ts';

// Public shipment registration (no account required).
// Pricing, tracking numbers and the delivery OTP are generated server-side.
async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const invalid = validateShipmentInput(body);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });

    const service = client.asServiceRole;
    const tenant = await service.entities.Tenant.get(String(body.tenant_id));
    if (!tenant || tenant.status !== 'active') {
      return Response.json({ error: 'This logistics partner is not accepting shipments.' }, { status: 400 });
    }

    const shipment = await createShipmentRecord(service, tenant, body, body.source === 'portal' ? 'portal' : 'web');

    return Response.json({
      tracking_number: shipment.tracking_number,
      waybill_number: shipment.waybill_number,
      status: shipment.status,
      currency: shipment.currency,
      base_price: shipment.base_price,
      surcharge_total: shipment.surcharge_total,
      total_amount: shipment.total_amount,
      eta_date: shipment.eta_date,
      delivery_otp: shipment.delivery_otp,
      tenant_name: shipment.tenant_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
