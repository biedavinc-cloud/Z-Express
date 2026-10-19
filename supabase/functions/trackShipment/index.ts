import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { trackNumbers } from '../_shared/logistics.ts';

// Public multi-tracking. The tracking number itself is the access token,
// so only non-sensitive shipment fields are returned.
async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const numbers = Array.isArray(body.numbers) ? body.numbers : [];
    if (!numbers.length) return Response.json({ error: 'Provide at least one tracking number.' }, { status: 400 });

    const results = await trackNumbers(client.asServiceRole, numbers);
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
