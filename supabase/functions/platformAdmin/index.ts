import { createClientFromRequest, serve } from '../_shared/platform.ts';

// Super-admin console operations.
// Reads rely on row-level security (only the platform-admin role passes it);
// every write below is gated on the caller's role server-side, so the endpoint
// stays safe even when someone calls it directly with a member token.
const PLANS = { starter: 49, pro: 89, enterprise: 199 };
const TENANT_STATUS = ['pending', 'active', 'suspended'];
const SUB_STATUS = ['trialing', 'active', 'past_due', 'cancelled'];
const CYCLES = ['monthly', 'yearly'];
const APP_ROLES = ['admin', 'user'];
const MODULES = ['companies', 'subscriptions', 'invoices', 'staff'];
const DOC_STATUS = ['pending', 'verified', 'rejected'];

// Every action belongs to one module of the console; a staff member's custom
// platform role decides which of them they may run.
const ACTION_MODULE = {
  company_status: 'companies',
  company_plan: 'companies',
  document_status: 'companies',
  subscription_save: 'subscriptions',
  invoice_create: 'invoices',
  invoice_paid: 'invoices',
  staff_role: 'staff',
  staff_invite: 'staff',
  role_save: 'staff',
  role_delete: 'staff',
};

// A member with no platform role is a platform owner and keeps every module.
// Anyone else gets exactly what their assigned role grants.
const resolveAccess = async (service, user) => {
  const members = (await service.entities.User.list()) || [];
  const me = members.find((member) => member.id === user.id);
  if (!me || !me.platform_role) return { full: true, roleId: null, permissions: MODULES };
  const role = await service.entities.PlatformRole.get(me.platform_role).catch(() => null);
  if (!role) return { full: true, roleId: null, permissions: MODULES };
  const permissions = Array.isArray(role.permissions)
    ? role.permissions.filter((permission) => MODULES.includes(permission))
    : [];
  return { full: false, roleId: role.id, permissions };
};

// A company file is verified once every document is, rejected as soon as one
// is, and pending while a review is outstanding.
const reviewStatus = (documents = []) => {
  if (!documents.length) return 'not_submitted';
  if (documents.some((doc) => doc.status === 'rejected')) return 'rejected';
  if (documents.every((doc) => doc.status === 'verified')) return 'verified';
  return 'pending';
};

const clean = (value, max = 120) =>
  String(value === undefined || value === null ? '' : value)
    .trim()
    .slice(0, max);

const oneOf = (value, allowed) => (allowed.includes(value) ? value : null);
const today = () => new Date().toISOString().slice(0, 10);

const amountFor = (plan, cycle) => {
  const monthly = PLANS[plan] || PLANS.starter;
  return cycle === 'yearly' ? monthly * 10 : monthly;
};

const nextPeriodEnd = (cycle) => {
  const end = new Date();
  if (cycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString().slice(0, 10);
};

// Billing records belong to the agency's managers — the same role scope the
// tenant portal writes with — so a driver or a hub supervisor cannot read the
// agency's invoices off the record store.
const billingEmails = async (service: any, tenant: any) => {
  const members = await service.entities.TeamMember.filter({ tenant_id: tenant.id });
  const allowed = members
    .filter(
      (member: any) =>
        member.status !== 'suspended' && ['tenant_admin', 'billing_manager'].includes(member.role)
    )
    .map((member: any) => member.email);
  return Array.from(new Set([tenant.owner_email, ...allowed].filter(Boolean)));
};

const createInvoice = async (service, { tenant, plan, cycle, amount, seats }) => {
  const year = new Date().getFullYear();
  return service.entities.Invoice.create({
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    number: `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
    plan,
    amount,
    currency: 'USD',
    billing_cycle: cycle,
    seats,
    period_start: today(),
    period_end: nextPeriodEnd(cycle),
    issued_at: today(),
    due_at: nextPeriodEnd('monthly'),
    status: 'pending',
    method: 'platform',
    notes: 'Issued from the platform console.',
    member_emails: await billingEmails(service, tenant),
  });
};

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = client.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action, 40);

    // Only console actions carry a module, so the role lookup is skipped for a
    // call that cannot reach a module at all.
    const required = ACTION_MODULE[action];
    const access = required
      ? await resolveAccess(service, user)
      : { full: true, roleId: null, permissions: MODULES };
    if (required && !access.permissions.includes(required)) {
      return Response.json({ error: 'Your platform role does not allow this action' }, { status: 403 });
    }

    if (action === 'company_status') {
      const status = oneOf(clean(body.status, 20), TENANT_STATUS);
      if (!status) return Response.json({ error: 'Unknown status' }, { status: 400 });
      const tenant = await service.entities.Tenant.get(clean(body.tenant_id, 40));
      if (!tenant) return Response.json({ error: 'Company not found' }, { status: 404 });
      const updated = await service.entities.Tenant.update(tenant.id, { status });
      return Response.json({ ok: true, status: updated.status });
    }

    if (action === 'company_plan') {
      const plan = oneOf(clean(body.plan, 20), Object.keys(PLANS));
      const cycle = oneOf(clean(body.billing_cycle, 20), CYCLES) || 'monthly';
      if (!plan) return Response.json({ error: 'Unknown plan' }, { status: 400 });
      const tenant = await service.entities.Tenant.get(clean(body.tenant_id, 40));
      if (!tenant) return Response.json({ error: 'Company not found' }, { status: 404 });

      const amount = amountFor(plan, cycle);
      await service.entities.Tenant.update(tenant.id, { plan, monthly_fee: PLANS[plan] });

      const existing = await service.entities.Subscription.filter({ tenant_id: tenant.id });
      const current = existing[0];
      const seats = Number(current && current.seats) || 3;
      const payload = {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        plan,
        amount,
        currency: 'USD',
        billing_cycle: cycle,
        seats,
        status: current && current.status !== 'cancelled' ? current.status : 'active',
        current_period_end: nextPeriodEnd(cycle),
        member_emails: await billingEmails(service, tenant),
      };
      const subscription = current
        ? await service.entities.Subscription.update(current.id, payload)
        : await service.entities.Subscription.create({
            ...payload,
            started_at: today(),
            notes: 'Created from the platform console.',
          });
      const invoice = await createInvoice(service, { tenant, plan, cycle, amount, seats });
      return Response.json({ ok: true, subscription, invoice });
    }

    if (action === 'subscription_save') {
      const current = await service.entities.Subscription.get(clean(body.subscription_id, 40)).catch(() => null);
      if (!current) return Response.json({ error: 'Subscription not found' }, { status: 404 });
      const plan = oneOf(clean(body.plan, 20), Object.keys(PLANS)) || current.plan || 'starter';
      const cycle = oneOf(clean(body.billing_cycle, 20), CYCLES) || current.billing_cycle || 'monthly';
      const status = oneOf(clean(body.status, 20), SUB_STATUS) || current.status || 'trialing';
      const patch = { plan, billing_cycle: cycle, status, amount: amountFor(plan, cycle) };
      if (status === 'active' && !current.current_period_end) patch.current_period_end = nextPeriodEnd(cycle);
      const subscription = await service.entities.Subscription.update(current.id, patch);
      return Response.json({ ok: true, subscription });
    }

    if (action === 'invoice_create') {
      const subscription = await service.entities
        .Subscription.get(clean(body.subscription_id, 40))
        .catch(() => null);
      const tenantId = (subscription && subscription.tenant_id) || clean(body.tenant_id, 40);
      const tenant = tenantId ? await service.entities.Tenant.get(tenantId).catch(() => null) : null;
      if (!tenant) return Response.json({ error: 'Company not found' }, { status: 404 });
      const plan =
        oneOf(clean(body.plan, 20), Object.keys(PLANS)) || (subscription && subscription.plan) || tenant.plan;
      const cycle = oneOf(clean(body.billing_cycle, 20), CYCLES) || (subscription && subscription.billing_cycle) || 'monthly';
      const requested = Number(body.amount);
      const amount = requested > 0 ? Math.min(requested, 100000) : amountFor(plan, cycle);
      const seats = Number(subscription && subscription.seats) || 3;
      const invoice = await createInvoice(service, { tenant, plan, cycle, amount, seats });
      return Response.json({ ok: true, invoice });
    }

    if (action === 'invoice_paid') {
      const invoice = await service.entities.Invoice.get(clean(body.invoice_id, 40)).catch(() => null);
      if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
      const updated = await service.entities.Invoice.update(invoice.id, {
        status: 'paid',
        paid_at: today(),
        method: clean(body.method, 40) || invoice.method || 'platform',
      });
      return Response.json({ ok: true, invoice: updated });
    }

    if (action === 'staff_role') {
      const userId = clean(body.user_id, 40);
      const team = (await service.entities.User.list()) || [];
      const target = team.find((member) => member.id === userId);
      if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

      const patch = {};
      if (body.role !== undefined) {
        const role = oneOf(clean(body.role, 20), APP_ROLES);
        if (!role) return Response.json({ error: 'Unknown role' }, { status: 400 });
        if (userId === user.id && role !== 'admin') {
          return Response.json({ error: 'You cannot remove your own admin access' }, { status: 400 });
        }
        const otherAdmins = team.filter((member) => member.role === 'admin' && member.id !== userId);
        if (role !== 'admin' && otherAdmins.length === 0) {
          return Response.json({ error: 'At least one platform admin must remain' }, { status: 400 });
        }
        patch.role = role;
      }

      if (body.platform_role !== undefined) {
        // Only an owner may widen access, so a scoped staff manager can hand out
        // duties but never grant owner-level reach.
        if (!access.full && !target.platform_role) {
          return Response.json({ error: 'Only a platform owner can change this account' }, { status: 403 });
        }
        const roleId = clean(body.platform_role, 40);
        if (!roleId) {
          if (!access.full) {
            return Response.json({ error: 'Only a platform owner can grant owner access' }, { status: 403 });
          }
          patch.platform_role = '';
          patch.platform_role_name = '';
        } else {
          const role = await service.entities.PlatformRole.get(roleId).catch(() => null);
          if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
          patch.platform_role = role.id;
          patch.platform_role_name = role.name;
        }
      }

      if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to update' }, { status: 400 });
      const updated = await service.entities.User.update(userId, patch);
      return Response.json({
        ok: true,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          platform_role: updated.platform_role || '',
          platform_role_name: updated.platform_role_name || '',
        },
      });
    }

    if (action === 'document_status') {
      const status = oneOf(clean(body.status, 20), DOC_STATUS);
      const documentId = clean(body.document_id, 60);
      if (!status || !documentId) {
        return Response.json({ error: 'A document and a status are required' }, { status: 400 });
      }
      const tenant = await service.entities.Tenant.get(clean(body.tenant_id, 40)).catch(() => null);
      if (!tenant) return Response.json({ error: 'Company not found' }, { status: 404 });

      let found = false;
      const documents = (tenant.documents || []).map((document) => {
        if (document.id !== documentId) return document;
        found = true;
        return {
          ...document,
          status,
          note: clean(body.note, 200) || document.note || '',
          reviewed_at: new Date().toISOString(),
        };
      });
      if (!found) return Response.json({ error: 'Document not found' }, { status: 404 });

      const updated = await service.entities.Tenant.update(tenant.id, {
        documents,
        kyc_status: reviewStatus(documents),
      });
      return Response.json({
        ok: true,
        documents: updated.documents || [],
        kyc_status: updated.kyc_status,
      });
    }

    if (action === 'role_save') {
      const name = clean(body.name, 60);
      if (!name) return Response.json({ error: 'A role name is required' }, { status: 400 });
      const permissions = Array.from(
        new Set(
          (Array.isArray(body.permissions) ? body.permissions : []).filter((permission) =>
            MODULES.includes(permission)
          )
        )
      );
      const payload = { name, description: clean(body.description, 200), permissions };
      const roleId = clean(body.role_id, 40);

      if (!roleId) {
        const created = await service.entities.PlatformRole.create(payload);
        return Response.json({ ok: true, role: created });
      }

      const role = await service.entities.PlatformRole.get(roleId).catch(() => null);
      if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
      if (!access.full && role.id === access.roleId) {
        return Response.json({ error: 'You cannot edit the role you are assigned' }, { status: 403 });
      }
      const updated = await service.entities.PlatformRole.update(role.id, payload);

      // Staff records keep a name snapshot for the console; refresh it on rename.
      const members = (await service.entities.User.list()) || [];
      await Promise.allSettled(
        members
          .filter((member) => member.platform_role === role.id && member.platform_role_name !== name)
          .map((member) => service.entities.User.update(member.id, { platform_role_name: name }))
      );
      return Response.json({ ok: true, role: updated });
    }

    if (action === 'role_delete') {
      const roleId = clean(body.role_id, 40);
      const role = await service.entities.PlatformRole.get(roleId).catch(() => null);
      if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
      if (!access.full && role.id === access.roleId) {
        return Response.json({ error: 'You cannot delete the role you are assigned' }, { status: 403 });
      }
      const members = (await service.entities.User.list()) || [];
      const assigned = members.filter((member) => member.platform_role === role.id);
      if (assigned.length) {
        return Response.json(
          { error: `Reassign the ${assigned.length} staff member(s) on this role first` },
          { status: 400 }
        );
      }
      await service.entities.PlatformRole.delete(role.id);
      return Response.json({ ok: true });
    }

    if (action === 'staff_invite') {
      const email = clean(body.email, 160).toLowerCase();
      const role = oneOf(clean(body.role, 20), APP_ROLES) || 'user';
      if (!email || !email.includes('@')) {
        return Response.json({ error: 'A valid email is required' }, { status: 400 });
      }
      await service.users.inviteUser(email, role);
      return Response.json({ ok: true, email, role });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
