import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, createClientFromRequest, serve } from '../_shared/platform.ts';

// Short-lived link to a private file. Allowed for the uploader, platform admins,
// and anyone who can read a record that references the file (row-level security
// decides that, so a driver's proof-of-delivery photo is visible to the agency).
async function handler(req: Request) {
  const client = createClientFromRequest(req);
  const user = await client.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const uri = String(body.file_uri || '');
  const match = uri.match(/^private-files\/(.+)$/);
  if (!match || match[1].includes('..')) return Response.json({ error: 'Invalid file.' }, { status: 400 });
  const path = match[1];

  let allowed = user.role === 'admin' || path.startsWith(`${user.id}/`);
  if (!allowed) {
    const token = (req.headers.get('authorization') || '').slice(7);
    const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data } = await asUser.rpc('app_file_referenced', { p_uri: uri });
    allowed = data === true;
  }
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const expiresIn = Math.min(Math.max(Number(body.expires_in) || 300, 60), 3600);
  const { data, error } = await admin().storage.from('private-files').createSignedUrl(path, expiresIn);
  if (error || !data) return Response.json({ error: 'File not found.' }, { status: 404 });
  return Response.json({ signed_url: data.signedUrl });
}

serve(handler);
