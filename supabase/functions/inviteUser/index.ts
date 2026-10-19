import { admin, appUrl, createClientFromRequest, serve } from '../_shared/platform.ts';

// Sends an invitation email so a person can set up their account.
// Allowed for platform admins and for agency managers (owner or tenant_admin).
async function handler(req: Request) {
  const client = createClientFromRequest(req);
  const user = await client.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const service = client.asServiceRole;
  let allowed = user.role === 'admin';
  if (!allowed) {
    const owned = await service.entities.Tenant.filter({ owner_email: user.email }, { limit: 1 });
    if (owned.length) allowed = true;
  }
  if (!allowed) {
    const rows = await service.entities.TeamMember.filter({ email: user.email, role: 'tenant_admin' });
    allowed = rows.some((row: any) => row.status !== 'suspended');
  }
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin().auth.admin.inviteUserByEmail(email, {
    redirectTo: appUrl() ? `${appUrl()}/login` : undefined,
  });
  // An already-registered address is not an error for the inviter.
  if (error && !/already|registered|exists/i.test(error.message)) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  // Roles are never granted through invitations; promote_admin() is the only path.
  return Response.json({ ok: true, email });
}

serve(handler);
