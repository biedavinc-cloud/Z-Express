import { createClientFromRequest, serve } from '../_shared/platform.ts';

// Public, deliberately narrow lookup: a customer about to book a parcel needs to
// know how the chosen logistics partner collects money. Only the payer-facing
// fields are returned and the tenant id is validated.
const PUBLIC_FIELDS = [
  'type',
  'label',
  'account_name',
  'account_number',
  'bank_name',
  'country',
  'currency',
  'instructions',
];

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = String(body.tenant_id || '').trim().slice(0, 40);
    if (!tenantId) return Response.json({ error: 'tenant_id is required' }, { status: 400 });

    const rows = await client.asServiceRole.entities.PaymentMethod.filter({
      tenant_id: tenantId,
      active: true,
    });

    const methods = rows
      .slice()
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .slice(0, 20)
      .map((row) => {
        const method = { id: row.id };
        for (const field of PUBLIC_FIELDS) method[field] = row[field] || '';
        return method;
      });

    return Response.json({ methods });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
