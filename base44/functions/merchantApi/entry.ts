import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import {
  buildQuotes,
  createShipmentRecord,
  deliverWebhook,
  findShipmentByRef,
  normaliseQuoteInput,
  trackNumbers,
  validateQuoteInput,
  validateShipmentInput,
} from '../../shared/logistics.ts';

// A key can be throttled per merchant plan; with no configured value the platform
// allows a comfortable 60 calls a minute, well above normal store traffic.
const DEFAULT_RATE_LIMIT_PER_MIN = 60;
const RATE_WINDOW_MS = 60_000;

const rateLimitFor = (apiKey) => {
  const configured = Number(apiKey.rate_limit_per_min);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_RATE_LIMIT_PER_MIN;
  return Math.min(Math.floor(configured), 1000);
};

// Merchant / e-commerce bridge API. Every call is authenticated with a tenant API key.
// POST { action: 'rate' | 'create' | 'track' | 'pod', ... }
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const key = String(req.headers.get('x-api-key') || body.api_key || '').trim();
    if (!key) return Response.json({ error: 'Missing x-api-key header.' }, { status: 401 });

    const keys = await service.entities.ApiKey.filter({ api_key: key, active: true });
    const apiKey = keys[0];
    if (!apiKey) return Response.json({ error: 'Invalid or disabled API key.' }, { status: 401 });

    const tenant = await service.entities.Tenant.get(apiKey.tenant_id);
    if (!tenant || tenant.status !== 'active') {
      return Response.json({ error: 'Tenant account is not active.' }, { status: 403 });
    }

    // Per-key throttling: the moving window lives on the key record itself, so a
    // single write accounts for this call and keeps the counters current. A
    // refused call is never counted.
    const now = Date.now();
    const limit = rateLimitFor(apiKey);
    const windowStart = apiKey.window_started_at ? Date.parse(apiKey.window_started_at) : 0;
    const freshWindow = !windowStart || Number.isNaN(windowStart) || now - windowStart >= RATE_WINDOW_MS;
    const used = freshWindow ? 0 : Number(apiKey.window_calls) || 0;

    if (used >= limit) {
      const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - windowStart)) / 1000));
      return Response.json(
        {
          error: `Rate limit reached: ${limit} requests per minute on this key. Retry in ${retryAfter}s.`,
          code: 'rate_limited',
          retry_after: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    waitUntil(
      service.entities.ApiKey.update(apiKey.id, {
        last_used_at: new Date(now).toISOString(),
        call_count: (Number(apiKey.call_count) || 0) + 1,
        rate_limit_per_min: limit,
        window_started_at: freshWindow ? new Date(now).toISOString() : apiKey.window_started_at,
        window_calls: used + 1,
      })
    );

    const action = String(body.action || '').toLowerCase();

    if (action === 'rate') {
      const params = normaliseQuoteInput(body);
      const invalid = validateQuoteInput(params);
      if (invalid) return Response.json({ error: invalid }, { status: 400 });
      const quotes = await buildQuotes(service, params);
      return Response.json({ quotes });
    }

    if (action === 'create') {
      const invalid = validateShipmentInput({ ...body, tenant_id: tenant.id });
      if (invalid) return Response.json({ error: invalid }, { status: 400 });
      // A retried call must return the parcel that already exists rather than
      // create a second one for the same merchant reference.
      const existing = await findShipmentByRef(service, tenant.id, body.merchant_ref);
      const shipment = existing || (await createShipmentRecord(service, tenant, body, 'api'));

      const delivery = existing ? null : deliverWebhook(
        body.webhook_url || apiKey.webhook_url,
        'shipment.created',
        {
          tracking_number: shipment.tracking_number,
          waybill_number: shipment.waybill_number,
          status: shipment.status,
          merchant_ref: shipment.merchant_ref,
          tenant_id: tenant.id,
          total_amount: shipment.total_amount,
          currency: shipment.currency,
          eta_date: shipment.eta_date,
        },
        {
          service,
          tenant_id: tenant.id,
          label: body.webhook_url ? 'Merchant webhook' : `API key: ${apiKey.label || apiKey.id}`,
          member_emails: shipment.member_emails || [],
          payload_ref: shipment.tracking_number,
        }
      );
      if (delivery) waitUntil(delivery);

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
        duplicate: Boolean(existing),
        tracking_url: `${req.headers.get('x-base44-app-url') || ''}/track?numbers=${shipment.tracking_number}`,
      });
    }

    if (action === 'track') {
      const numbers = Array.isArray(body.numbers) ? body.numbers : [body.tracking_number];
      // Scoped to the key's own agency: a key can never read another tenant's parcels.
      const results = await trackNumbers(service, numbers, { tenantId: tenant.id });
      return Response.json({ results });
    }

    if (action === 'pod') {
      const numbers = [body.tracking_number];
      const results = await trackNumbers(service, numbers, { tenantId: tenant.id });
      if (!results.length) return Response.json({ error: 'Shipment not found.' }, { status: 404 });
      const shipments = await service.entities.Shipment.filter({
        tenant_id: tenant.id,
        tracking_number: String(body.tracking_number || '').trim().toUpperCase(),
      });
      const s = shipments[0];
      if (!s) return Response.json({ error: 'Shipment not found.' }, { status: 404 });
      return Response.json({
        tracking_number: s.tracking_number,
        status: s.status,
        delivered_at: s.pod_at || null,
        received_by: s.pod_recipient_name || null,
        has_signature: Boolean(s.pod_signature),
        has_photo: Boolean(s.pod_photo_uri),
        photo_uri: s.pod_photo_uri || null,
        events: results[0].events,
      });
    }

    return Response.json({ error: "Unsupported action. Use 'rate', 'create', 'track' or 'pod'." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}