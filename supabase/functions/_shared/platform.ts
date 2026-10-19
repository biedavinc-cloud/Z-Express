// Runtime helpers shared by every edge function: caller identity, the record
// store (same API the browser client uses, but with service-role access),
// CORS, background work and the optional LLM call.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

let adminClient: ReturnType<typeof createClient> | null = null;
export function admin() {
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

// ---------------------------------------------------------------------------
// Record store
// ---------------------------------------------------------------------------
const withItems = (rows: unknown) => {
  const list = Array.isArray(rows) ? rows : [];
  Object.defineProperty(list, 'items', { value: list, enumerable: false });
  return list;
};

async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await admin().rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

function options(sortOrOptions?: any, limit?: number, skip?: number) {
  if (sortOrOptions && typeof sortOrOptions === 'object') {
    return { sort: sortOrOptions.sort ?? null, limit: sortOrOptions.limit ?? limit ?? 1000, skip: sortOrOptions.skip ?? skip ?? 0 };
  }
  return { sort: sortOrOptions ?? null, limit: limit ?? 1000, skip: skip ?? 0 };
}

function entity(name: string) {
  return {
    async list(sort?: any, limit?: number, skip?: number) {
      const o = options(sort, limit, skip);
      return withItems(await rpc('app_query', { p_entity: name, p_query: {}, p_sort: o.sort, p_limit: o.limit, p_skip: o.skip }));
    },
    async filter(query: Record<string, unknown> = {}, sort?: any, limit?: number, skip?: number) {
      const o = options(sort, limit, skip);
      return withItems(
        await rpc('app_query', { p_entity: name, p_query: query || {}, p_sort: o.sort, p_limit: o.limit, p_skip: o.skip })
      );
    },
    // Resolves to null when the record does not exist.
    async get(id: string) {
      return (await rpc('app_get', { p_entity: name, p_id: String(id) })) ?? null;
    },
    async create(data: Record<string, unknown>) {
      return rpc('app_create', { p_entity: name, p_data: data || {} });
    },
    async bulkCreate(rows: Record<string, unknown>[]) {
      return withItems(await rpc('app_bulk_create', { p_entity: name, p_rows: rows || [] }));
    },
    async update(id: string, patch: Record<string, unknown>) {
      const row = await rpc('app_update', { p_entity: name, p_id: String(id), p_patch: patch || {} });
      if (!row) throw new Error(`${name} ${id} not found`);
      return row;
    },
    // Applies several patches, one per row: [{ id, ...fields }].
    async bulkUpdate(rows: Array<Record<string, unknown> & { id: string }>) {
      for (const row of rows || []) {
        const { id, ...patch } = row;
        await rpc('app_update', { p_entity: name, p_id: String(id), p_patch: patch });
      }
      return rows;
    },
    // Updates every matching row with $set / $addToSet / $pull operators.
    async updateMany(query: Record<string, unknown>, ops: Record<string, unknown>) {
      return Number(await rpc('app_update_many', { p_entity: name, p_query: query || {}, p_ops: ops || {} }));
    },
    async delete(id: string) {
      await rpc('app_delete', { p_entity: name, p_id: String(id) });
      return { success: true };
    },
    async count(query: Record<string, unknown> = {}) {
      return Number(await rpc('app_count', { p_entity: name, p_query: query || {} }));
    },
    async aggregate(opts: { query?: Record<string, unknown>; groupBy?: string; sum?: string | string[]; sort?: string; limit?: number } = {}) {
      const sums = Array.isArray(opts.sum) ? opts.sum : opts.sum ? [opts.sum] : [];
      return rpc('app_aggregate', {
        p_entity: name,
        p_query: opts.query || {},
        p_group_by: opts.groupBy ?? null,
        p_sums: sums,
        p_sort: opts.sort ?? null,
        p_limit: opts.limit ?? 100,
      });
    },
  };
}

const entities: Record<string, ReturnType<typeof entity>> = new Proxy({} as any, {
  get(target: any, prop: string | symbol) {
    if (typeof prop !== 'string') return undefined;
    if (!target[prop]) target[prop] = entity(prop);
    return target[prop];
  },
});

// ---------------------------------------------------------------------------
// Caller identity
// ---------------------------------------------------------------------------
export type Caller = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  platform_role: string | null;
  platform_role_name: string | null;
};

async function resolveCaller(req: Request): Promise<Caller | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  // The public anon key is not a person.
  if (!token || token === ANON_KEY) return null;

  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await admin().from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  return {
    id: data.user.id,
    email: (data.user.email || '').toLowerCase(),
    full_name: profile?.full_name || profile?.display_name || data.user.user_metadata?.full_name || '',
    role: profile?.role || 'user',
    platform_role: profile?.platform_role ?? null,
    platform_role_name: profile?.platform_role_name ?? null,
  };
}

/** Same shape the previous runtime exposed, so handlers read naturally. */
export function createClientFromRequest(req: Request) {
  let cached: Promise<Caller | null> | null = null;
  return {
    auth: {
      /** The signed-in caller, or null for anonymous requests. */
      me: () => (cached ??= resolveCaller(req)),
    },
    entities,
    asServiceRole: {
      entities,
      users: { inviteUser },
      integrations: { Core: { InvokeLLM: invokeLLM } },
    },
  };
}

// Sends an invitation email. The role argument is accepted for compatibility but
// never grants anything: administrators are only created with promote_admin().
async function inviteUser(email: string, _role = 'user') {
  const { error } = await admin().auth.admin.inviteUserByEmail(String(email).trim().toLowerCase(), {
    redirectTo: appUrl() ? `${appUrl()}/login` : undefined,
  });
  if (error && !/already|registered|exists/i.test(error.message)) throw new Error(error.message);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Serving, CORS, background work
// ---------------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-signature',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export function serve(handler: (req: Request) => Response | Promise<Response>) {
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
    let response: Response;
    try {
      response = await handler(req);
    } catch (error) {
      console.error('unhandled function error', error);
      response = Response.json({ error: 'Internal error' }, { status: 500 });
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  });
}

/** Keeps the isolate alive until a background promise settles (webhook fan-out, etc.). */
export function waitUntil(promise: Promise<unknown>) {
  const safe = Promise.resolve(promise).catch((error) => console.error('background task failed', error));
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(safe);
}

/** Public address of the web app, used to build links sent to customers. */
export function appUrl(): string {
  return (Deno.env.get('APP_URL') || '').replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// Optional LLM fallback for the support assistant (needs LLM_API_KEY)
// ---------------------------------------------------------------------------
async function invokeLLM({ prompt }: { prompt: string }): Promise<string> {
  const key = Deno.env.get('LLM_API_KEY');
  if (!key) throw new Error('The assistant is not configured (LLM_API_KEY is missing).');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: Deno.env.get('LLM_MODEL') || 'claude-sonnet-5-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed (${response.status})`);
  const data = await response.json();
  return (data.content || []).map((block: any) => (block.type === 'text' ? block.text : '')).join('').trim();
}
