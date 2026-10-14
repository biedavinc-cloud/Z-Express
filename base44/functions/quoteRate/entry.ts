import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildQuotes, normaliseQuoteInput, validateQuoteInput } from '../../shared/logistics.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const params = normaliseQuoteInput(body);
    const invalid = validateQuoteInput(params);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });

    const quotes = await buildQuotes(base44.asServiceRole, params);
    return Response.json({ quotes, count: quotes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}