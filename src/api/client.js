import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Backend connection
// ---------------------------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isBackendConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    '[liafrik] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. Copy .env.example to .env.local and fill them in.'
  );
}

// A placeholder keeps the public pages rendering even when the backend is not
// configured yet; every data call then fails with a clear message instead.
export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, { status, data, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
    this.response = { status, data };
  }
}

const AUTH_MESSAGES = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email address first. Check your inbox for the 6-digit code.',
  user_already_exists: 'An account with this email already exists. Try signing in instead.',
  weak_password: 'This password is too weak. Use at least 8 characters.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a minute and try again.',
  otp_expired: 'This code has expired. Request a new one.',
  same_password: 'Choose a password different from your current one.',
};

function authError(error) {
  const code = error?.code;
  const message = AUTH_MESSAGES[code] || error?.message || 'Authentication failed.';
  return new ApiError(message, { status: error?.status, code, data: { error: message } });
}

function requireBackend() {
  if (!isBackendConfigured) {
    throw new ApiError('The backend is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', {
      status: 503,
      code: 'backend_not_configured',
    });
  }
}

// ---------------------------------------------------------------------------
// Entities (generic record store with Mongo-style filters)
// ---------------------------------------------------------------------------
// Results are arrays that also expose themselves as `.items`, so both
// `rows.map(...)` and `page.items` keep working.
const withItems = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  Object.defineProperty(list, 'items', { value: list, enumerable: false });
  return list;
};

const pick = (row, fields) => {
  if (!fields?.length) return row;
  const out = { id: row.id };
  for (const field of fields) out[field] = row[field];
  return out;
};

function parseOptions(sortOrOptions, limit, skip) {
  if (sortOrOptions && typeof sortOrOptions === 'object') {
    return {
      sort: sortOrOptions.sort ?? null,
      limit: sortOrOptions.limit ?? limit ?? 1000,
      skip: sortOrOptions.skip ?? skip ?? 0,
      fields: sortOrOptions.fields,
    };
  }
  return { sort: sortOrOptions ?? null, limit: limit ?? 1000, skip: skip ?? 0, fields: undefined };
}

async function rpc(name, args) {
  requireBackend();
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const status = error.code === '42501' ? 403 : 400;
    throw new ApiError(error.message, { status, code: error.code, data: { error: error.message } });
  }
  return data;
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export { escapeRegExp };

function makeEntity(name) {
  return {
    async list(sort, limit, skip) {
      const opts = parseOptions(sort, limit, skip);
      const rows = await rpc('app_query', {
        p_entity: name,
        p_query: {},
        p_sort: opts.sort,
        p_limit: opts.limit,
        p_skip: opts.skip,
      });
      return withItems(rows.map((row) => pick(row, opts.fields)));
    },
    async filter(query = {}, sort, limit, skip) {
      const opts = parseOptions(sort, limit, skip);
      const rows = await rpc('app_query', {
        p_entity: name,
        p_query: query || {},
        p_sort: opts.sort,
        p_limit: opts.limit,
        p_skip: opts.skip,
      });
      return withItems(rows.map((row) => pick(row, opts.fields)));
    },
    async get(id) {
      const row = await rpc('app_get', { p_entity: name, p_id: String(id) });
      if (!row) throw new ApiError(`${name} not found`, { status: 404, data: { error: 'Not found' } });
      return row;
    },
    async create(data) {
      return rpc('app_create', { p_entity: name, p_data: data || {} });
    },
    async bulkCreate(rows) {
      return withItems(await rpc('app_bulk_create', { p_entity: name, p_rows: rows || [] }));
    },
    async update(id, patch) {
      const row = await rpc('app_update', { p_entity: name, p_id: String(id), p_patch: patch || {} });
      if (!row) throw new ApiError(`${name} not found or not allowed`, { status: 404, data: { error: 'Not found' } });
      return row;
    },
    async delete(id) {
      const ok = await rpc('app_delete', { p_entity: name, p_id: String(id) });
      if (!ok) throw new ApiError(`${name} not found or not allowed`, { status: 404, data: { error: 'Not found' } });
      return { success: true };
    },
    async count(query = {}) {
      return Number(await rpc('app_count', { p_entity: name, p_query: query || {} }));
    },
    async aggregate({ query = {}, groupBy = null, sum = [], sort = null, limit = 100 } = {}) {
      const sums = Array.isArray(sum) ? sum : sum ? [sum] : [];
      return rpc('app_aggregate', {
        p_entity: name,
        p_query: query || {},
        p_group_by: groupBy,
        p_sums: sums,
        p_sort: sort,
        p_limit: limit,
      });
    },
  };
}

// The user directory lives in `profiles` (admins can read it all).
const userEntity = {
  async list(sort = '-created_date', limit = 1000) {
    requireBackend();
    const column = String(sort || '-created_date').replace(/^-/, '');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order(['created_date', 'updated_date', 'email', 'full_name'].includes(column) ? column : 'created_date', {
        ascending: !String(sort).startsWith('-'),
      })
      .limit(limit);
    if (error) throw new ApiError(error.message, { status: 403, data: { error: error.message } });
    return withItems(data);
  },
  async filter(query = {}) {
    const all = await this.list();
    const entries = Object.entries(query || {});
    return withItems(all.filter((row) => entries.every(([key, value]) => row[key] === value)));
  },
  async get(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error || !data) throw new ApiError('User not found', { status: 404 });
    return data;
  },
  async update(id, patch) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().maybeSingle();
    if (error || !data) throw new ApiError(error?.message || 'User not found or not allowed', { status: 403 });
    return data;
  },
};

const entities = new Proxy(
  { User: userEntity },
  {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!(prop in target)) target[prop] = makeEntity(prop);
      return target[prop];
    },
  }
);

// ---------------------------------------------------------------------------
// Backend functions (Supabase Edge Functions)
// ---------------------------------------------------------------------------
async function invoke(name, payload = {}) {
  requireBackend();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload ?? {}),
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', { status: 0 });
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = (data && typeof data === 'object' && (data.error || data.message)) || response.statusText || 'Request failed';
    throw new ApiError(message, { status: response.status, data, code: data?.code });
  }
  return { data, status: response.status };
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
let cachedUser = null;

async function loadUser(authUser) {
  if (!authUser) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: (authUser.email || '').toLowerCase(),
    full_name: profile?.full_name || profile?.display_name || meta.full_name || meta.name || '',
    display_name: profile?.display_name || '',
    role: profile?.role || 'user',
    platform_role: profile?.platform_role || null,
    platform_role_name: profile?.platform_role_name || null,
    account_type: profile?.account_type || null,
    country: profile?.country || null,
    phone: profile?.phone || null,
    avatar_url: meta.avatar_url || meta.picture || null,
    email_confirmed: Boolean(authUser.email_confirmed_at),
  };
}

const auth = {
  /** Current user (profile merged), or throws a 401 when signed out. */
  async me() {
    requireBackend();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      cachedUser = null;
      throw new ApiError('Not signed in', { status: 401, code: 'unauthorized' });
    }
    if (cachedUser && cachedUser.id === session.user.id) return cachedUser;
    cachedUser = await loadUser(session.user);
    return cachedUser;
  },

  async isAuthenticated() {
    if (!isBackendConfigured) return false;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return Boolean(session);
  },

  async loginViaEmailPassword(email, password) {
    requireBackend();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password,
    });
    if (error) throw authError(error);
    cachedUser = null;
    return { access_token: data.session?.access_token, user: data.user };
  },

  /** Creates the account. Resolves with `{ needsVerification }`. */
  async register({ email, password, profile = {} }) {
    requireBackend();
    const { data, error } = await supabase.auth.signUp({
      email: String(email).trim().toLowerCase(),
      password,
      options: {
        // Copied into the profile row by a database trigger, so nothing is lost
        // if the person confirms their email on another device.
        data: {
          full_name: profile.full_name,
          display_name: profile.display_name,
          account_type: profile.account_type,
          country: profile.country,
          phone: profile.phone,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw authError(error);
    // An already-registered address comes back with no identities (and no error)
    // when email confirmation is on, so the existing account is not leaked.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw authError({ code: 'user_already_exists' });
    }
    return { needsVerification: !data.session, access_token: data.session?.access_token };
  },

  async verifyOtp({ email, otpCode }) {
    requireBackend();
    const { data, error } = await supabase.auth.verifyOtp({
      email: String(email).trim().toLowerCase(),
      token: String(otpCode).trim(),
      type: 'signup',
    });
    if (error) throw authError(error);
    cachedUser = null;
    return { access_token: data.session?.access_token, user: data.user };
  },

  async resendOtp(email) {
    requireBackend();
    const { error } = await supabase.auth.resend({ type: 'signup', email: String(email).trim().toLowerCase() });
    if (error) throw authError(error);
  },

  async resetPasswordRequest(email) {
    requireBackend();
    const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw authError(error);
  },

  /** Sets a new password for the recovery session opened by the email link. */
  async updatePassword(newPassword) {
    requireBackend();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw authError(error);
  },

  async loginWithProvider(provider, returnTo = '/') {
    requireBackend();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // Come back through /login so the person lands on the right home for their role.
      options: {
        redirectTo: `${window.location.origin}/login${
          returnTo && returnTo !== '/' && returnTo.startsWith('/') ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
        }`,
      },
    });
    if (error) throw authError(error);
  },

  async updateMe(patch) {
    const user = await this.me();
    const allowed = ['full_name', 'display_name', 'account_type', 'country', 'phone'];
    const clean = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(clean).length) return user;
    const { error } = await supabase.from('profiles').update(clean).eq('id', user.id);
    if (error) throw new ApiError(error.message, { status: 400 });
    cachedUser = null;
    return this.me();
  },

  /** Signs out. Never redirects back to a protected page (that would loop to /login). */
  async logout(redirectTo = '/') {
    cachedUser = null;
    if (isBackendConfigured) await supabase.auth.signOut();
    if (redirectTo) window.location.assign(redirectTo);
  },

  redirectToLogin(returnTo) {
    const target = returnTo && returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.assign(`/login${target}`);
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'SIGNED_IN') cachedUser = null;
      callback(event, session);
    });
    return () => data.subscription.unsubscribe();
  },
};

// Inviting a person sends them an email to set up their account.
const users = {
  async inviteUser(email, role = 'user') {
    const { data } = await invoke('inviteUser', { email, role });
    return data;
  },
};

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------
const safeName = (name) =>
  String(name || 'file')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .slice(-80);

async function upload(bucket, file) {
  requireBackend();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError('Sign in to upload files.', { status: 401 });
  const path = `${session.user.id}/${crypto.randomUUID()}-${safeName(file?.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file?.type || undefined,
    upsert: false,
  });
  if (error) throw new ApiError(error.message, { status: 400, data: { error: error.message } });
  return path;
}

const integrations = {
  Core: {
    async UploadPublicFile({ file }) {
      const path = await upload('public-files', file);
      const { data } = supabase.storage.from('public-files').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
    async UploadPrivateFile({ file }) {
      const path = await upload('private-files', file);
      return { file_uri: `private-files/${path}` };
    },
    async CreateFileSignedUrl({ file_uri, expires_in = 300 }) {
      const { data } = await invoke('fileSignedUrl', { file_uri, expires_in });
      return data;
    },
  },
};

export const api = { entities, functions: { invoke }, auth, users, integrations };
