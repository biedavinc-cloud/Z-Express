import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { buildQuotes, normaliseQuoteInput, validateQuoteInput } from '../_shared/logistics.ts';

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const params = normaliseQuoteInput(body);
    const invalid = validateQuoteInput(params);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });

    const quotes = await buildQuotes(client.asServiceRole, params);
    return Response.json({ quotes, count: quotes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
