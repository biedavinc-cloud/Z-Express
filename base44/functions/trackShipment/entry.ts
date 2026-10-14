import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { trackNumbers } from '../../shared/logistics.ts';

// Public multi-tracking. The tracking number itself is the access token,
// so only non-sensitive shipment fields are returned.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const numbers = Array.isArray(body.numbers) ? body.numbers : [];
    if (!numbers.length) return Response.json({ error: 'Provide at least one tracking number.' }, { status: 400 });

    const results = await trackNumbers(base44.asServiceRole, numbers);
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}