import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { PLANS } from '../_shared/pricing.ts';

// Tenant staff management. Only the tenant owner (or a platform admin) may call it.
// Adding a member also grants that person access to every existing tenant record,
// which is what keeps the row-level security scoping in sync.
const SCOPED_ENTITIES = [
  'TeamMember',
  'Vehicle',
  'Hub',
  'Zone',
  'Surcharge',
  'Shipment',
  'ShipmentEvent',
  'CodEntry',
  'ApiKey',
  'Subscription',
  'WebhookEndpoint',
  'WebhookDelivery',
  'PaymentMethod',
  'MarketplaceConnection',
  'SupportTicket',
  'Invoice',
];

// Staff collections that only some roles may work with. The email list on each
// record is what enforces that, so it is rewritten every time the staff changes.
// Kept in step with ROLE_SCOPED_ENTITIES in src/lib/session.js.
const ROLE_SCOPED_ENTITIES: Record<string, string[]> = {
  ApiKey: ['tenant_admin'],
  WebhookEndpoint: ['tenant_admin'],
  WebhookDelivery: ['tenant_admin'],
  MarketplaceConnection: ['tenant_admin'],
  Zone: ['tenant_admin'],
  Surcharge: ['tenant_admin'],
  Hub: ['tenant_admin', 'hub_supervisor'],
  Vehicle: ['tenant_admin', 'hub_supervisor'],
  PaymentMethod: ['tenant_admin', 'billing_manager'],
  Subscription: ['tenant_admin', 'billing_manager'],
  Invoice: ['tenant_admin', 'billing_manager'],
};

// True when a role is granted access to at least one of the scoped collections,
// which is what decides whether a new member needs the re-alignment to run.
function isScopedRole(role: string) {
  return Object.values(ROLE_SCOPED_ENTITIES).some((roles) => roles.includes(role));
}

// A plan includes a number of users and extra ones are sold from the subscription
// page, so the seat count is what a tenant may actually staff. The subscription is
// the source of truth; the plan's own allowance is the fallback.
function planSeats(planId: string) {
  const plan = PLANS.find((row) => row.id === planId);
  return plan ? plan.seats : PLANS[0].seats;
}

async function seatAllowance(service: any, tenant: any) {
  const rows = await service.entities.Subscription.filter(
    { tenant_id: tenant.id },
    { sort: '-created_date', limit: 1 }
  );
  const subscription = (rows.items || rows)[0];
  const sold = Number(subscription?.seats);
  return sold > 0 ? sold : planSeats(subscription?.plan || tenant.plan);
}

// Only the records whose access list is actually out of date are written, so a
// routine staff change costs a handful of reads and no writes at all.
async function resyncRoleScope(service: any, tenantId: string) {
  const tenant = await service.entities.Tenant.get(tenantId);
  if (!tenant) return 0;

  const members = await service.entities.TeamMember.filter({ tenant_id: tenantId });
  const active = members.filter((member: any) => member.status !== 'suspended');
  let changed = 0;

  for (const [entity, roles] of Object.entries(ROLE_SCOPED_ENTITIES)) {
    const allowed = active.filter((member: any) => roles.includes(member.role)).map((member: any) => member.email);
    const emails = Array.from(new Set([tenant.owner_email, ...allowed].filter(Boolean)));

    const page = await service.entities[entity].filter({ tenant_id: tenantId }, { limit: 200, fields: ['member_emails'] });
    const rows = page?.items || [];
    const stale = rows.filter((row: any) => {
      const current = Array.isArray(row.member_emails) ? row.member_emails : [];
      return current.length !== emails.length || emails.some((email) => !current.includes(email));
    });
    if (!stale.length) continue;

    await service.entities[entity].bulkUpdate(stale.map((row: any) => ({ id: row.id, member_emails: emails })));
    changed += stale.length;
  }

  return changed;
}

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const service = client.asServiceRole;
    const tenantId = String(body.tenant_id || '');
    if (!tenantId) return Response.json({ error: 'tenant_id is required' }, { status: 400 });

    const tenant = await service.entities.Tenant.get(tenantId);
    if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 });
    if (user.role !== 'admin' && tenant.owner_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Re-aligns every staff collection with the current roles — used after a role
    // change and to bring records created before role scoping into line.
    if (body.action === 'resync') {
      const changed = await resyncRoleScope(service, tenantId);
      return Response.json({ ok: true, changed });
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return Response.json({ error: 'A valid email is required' }, { status: 400 });

    const members = Array.from(new Set([...(tenant.member_emails || []), tenant.owner_email, email].filter(Boolean)));

    if (body.action === 'remove') {
      const existing = await service.entities.TeamMember.filter({ tenant_id: tenantId, email });
      if (existing[0]) await service.entities.TeamMember.update(existing[0].id, { status: 'suspended' });
      const remaining = members.filter((e) => e !== email);
      await service.entities.Tenant.update(tenantId, { member_emails: remaining });
      for (const name of SCOPED_ENTITIES) {
        // The role-scoped collections are rewritten by the re-alignment below,
        // which keeps a removal to a single pass over the data.
        if (name === 'TeamMember' || ROLE_SCOPED_ENTITIES[name]) continue;
        await service.entities[name].updateMany({ tenant_id: tenantId }, { $pull: { member_emails: email } });
      }
      await resyncRoleScope(service, tenantId);
      return Response.json({ ok: true, member_emails: remaining });
    }

    const existing = await service.entities.TeamMember.filter({ tenant_id: tenantId, email });

    // Adding a user is what the plan pays for, so the allowance is enforced here
    // rather than only shown on the pricing table.
    if (!existing[0]) {
      const seats = await seatAllowance(service, tenant);
      const staff = await service.entities.TeamMember.filter({ tenant_id: tenantId });
      const active = (staff.items || staff).filter((row: any) => row.status !== 'suspended');
      if (active.length >= seats) {
        return Response.json(
          { error: 'seat_limit', code: 'seat_limit', seats, active: active.length },
          { status: 400 }
        );
      }
    }

    const payload = {
      tenant_id: tenantId,
      tenant_name: tenant.name,
      full_name: String(body.full_name || email.split('@')[0]).slice(0, 120),
      email,
      phone: String(body.phone || '').slice(0, 40),
      role: ['tenant_admin', 'hub_supervisor', 'dispatcher', 'billing_manager', 'driver'].includes(body.role)
        ? body.role
        : 'driver',
      status: 'active',
      hub_id: String(body.hub_id || ''),
      vehicle_id: String(body.vehicle_id || ''),
      availability: 'offline',
      member_emails: members,
    };

    const member = existing[0]
      ? await service.entities.TeamMember.update(existing[0].id, payload)
      : await service.entities.TeamMember.create(payload);

    if (!existing[0]) {
      await service.entities.Tenant.update(tenantId, { member_emails: members });
      for (const name of SCOPED_ENTITIES) {
        // The staff collections are role-scoped: the re-alignment below decides
        // who belongs on them, never a blanket grant.
        if (name === 'TeamMember' || ROLE_SCOPED_ENTITIES[name]) continue;
        await service.entities[name].updateMany({ tenant_id: tenantId }, { $addToSet: { member_emails: email } });
      }
      try {
        await service.users.inviteUser(email, 'user');
      } catch (inviteError) {
        // The invitation email is best-effort: access still works once they sign up.
      }
    }

    // A new role assignment, a reinstated account, or a brand-new member holding
    // a role that owns one of the scoped collections can move someone into or out
    // of those records, so that is when the re-alignment runs.
    const reassigned = existing[0] && (existing[0].role !== payload.role || existing[0].status !== 'active');
    const joinedScopedRole = !existing[0] && isScopedRole(payload.role);
    if (reassigned || joinedScopedRole) await resyncRoleScope(service, tenantId);

    return Response.json({ ok: true, member });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
