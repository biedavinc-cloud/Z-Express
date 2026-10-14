import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Z. Support — the in-app logistics assistant available to merchants and drivers.
// Runs on the workspace Gemini key (GEMINI_API_KEY); if that key is unavailable the
// platform's own Gemini model answers instead, so the assistant never goes dark.
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash'];
const MAX_MESSAGE = 1500;
const MAX_HISTORY = 12;
const MAX_CONTEXT = 1200;

const SYSTEM_PROMPT = `You are Z. Support, the in-app assistant of Express, a multi-tenant African logistics platform (carriers, hubs, dispatchers, drivers and merchants).

Rules:
- Answer in the language the user writes in (English, French, Kiswahili or Spanish).
- Be short and practical: 2 to 5 sentences, no filler, no marketing.
- You help with: booking a shipment, chargeable weight and pricing zones, pickup and delivery addresses, tracking numbers and delivery status, cash on delivery (COD) and settlement, payment methods, marketplace connections (Shopify, WooCommerce, Jumia...), API keys, webhooks and rate limits.
- You never invent a tracking number, an amount, a status or a delivery date. If the answer needs the live record, say which screen shows it (Tracking, Shipments, COD, Payments, API) and ask for the tracking number if it is missing.
- If the request is a complaint, a refund or a dispute, tell the user to open a support ticket in their space, and that customer support is reachable at express@zanldo.com.
- Never mention internal infrastructure, environment variables, API keys or other tenants.`;

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-MAX_HISTORY)
    .filter((entry) => entry && typeof entry.content === 'string' && entry.content.trim())
    .map((entry) => ({
      role: entry.role === 'user' ? 'user' : 'model',
      parts: [{ text: entry.content.trim().slice(0, MAX_MESSAGE) }],
    }));
}

// Google renames and retires Gemini models regularly, so the assistant asks the
// key which text models it actually has instead of assuming a name.
let modelCache = { at: 0, models: [] };

async function resolveModels(apiKey) {
  if (modelCache.models.length && Date.now() - modelCache.at < 600000) return modelCache.models;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!response.ok) return FALLBACK_MODELS;

  const data = await response.json();
  const usable = (data?.models || [])
    .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
    .map((model) => String(model.name || '').replace(/^models\//, ''))
    .filter((name) => name && !name.includes('embedding') && !name.includes('aqa'));

  const textOnly = usable.filter(
    (name) => !/(tts|image|audio|live|veo|imagen|thinking)/.test(name)
  );

  // Fast flash models first: they answer in the user's language without exposing
  // their reasoning, which a thinking model would print in the chat.
  const rank = (name) => {
    if (/^gemini-\d+(\.\d+)?-flash$/.test(name)) return 0;
    if (/-flash-lite$/.test(name)) return 1;
    if (/-flash/.test(name)) return 2;
    return 3;
  };

  const generation = (name) => {
    const match = name.match(/^gemini-(\d+)(?:\.(\d+))?/);
    return match ? Number(match[1]) * 100 + Number(match[2] || 0) : 0;
  };

  // Flash first, then the newest generation — the retired 2.x names are still
  // listed by the API but refuse to answer, so they are tried last.
  const ranked = [...textOnly].sort(
    (a, b) => rank(a) - rank(b) || generation(b) - generation(a)
  );

  const models = [...new Set([...ranked, ...FALLBACK_MODELS])];
  modelCache = { at: Date.now(), models };
  return models;
}

async function askGemini(apiKey, systemText, history, message) {
  let lastError = 'Gemini did not answer';
  const models = (await resolveModels(apiKey)).slice(0, 4);

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts
        .filter((part) => !part.thought)
        .map((part) => part.text || '')
        .join('')
        .trim()
        .slice(0, 1600);
      if (text) return { reply: text, model };
      lastError = 'Gemini returned an empty answer';
      continue;
    }

    const detail = (await response.text().catch(() => '')).slice(0, 200);
    lastError = `Gemini responded ${response.status} on ${model}`;
    console.log('zSupport gemini rejected:', model, response.status, detail);

    // A model name this key cannot use, or a model that is momentarily saturated,
    // is worth retrying on the next candidate; a refused key or an exhausted
    // quota is not.
    if (![400, 404, 503].includes(response.status)) break;
  }
  throw new Error(lastError);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim().slice(0, MAX_MESSAGE);
    if (!message) return Response.json({ error: 'message is required' }, { status: 400 });

    const context =
      body.context && typeof body.context === 'object'
        ? JSON.stringify(body.context).slice(0, MAX_CONTEXT)
        : '{}';

    const systemText = `${SYSTEM_PROMPT}

Signed-in user: ${user.full_name || user.email} (app role: ${user.role || 'user'}).
Live screen context supplied by the app: ${context}`;

    const history = sanitizeHistory(body.history);

    let apiKey = '';
    try {
      apiKey = secrets.get('GEMINI_API_KEY') || '';
    } catch {
      apiKey = '';
    }

    if (apiKey) {
      try {
        const gemini = await askGemini(apiKey, systemText, history, message);
        return Response.json({ reply: gemini.reply, model: gemini.model });
      } catch (error) {
        console.log('zSupport gemini fallback:', error.message);
      }
    }

    const transcript = history
      .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.parts[0].text}`)
      .join('\n');

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemText}

Conversation so far:
${transcript || '(none)'}

User: ${message}

Answer as Z. Support.`,
    });

    const reply = typeof response === 'string' ? response.trim() : String(response?.reply || '').trim();
    if (!reply) return Response.json({ error: 'The assistant could not answer.' }, { status: 502 });
    return Response.json({ reply, model: 'platform' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}