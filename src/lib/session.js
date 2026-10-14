import { base44 } from '@/api/base44Client';

export const ROLE_LABELS = {
  super_admin: 'Platform Admin',
  tenant_admin: 'Agency Manager',
  hub_supervisor: 'Hub Supervisor',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
  billing_manager: 'Billing Manager',
  merchant: 'Merchant',
  guest: 'Guest',
};

export const STAFF_ROLES = ['tenant_admin', 'hub_supervisor', 'dispatcher', 'billing_manager', 'driver'];

// Resolves who the signed-in person is inside the logistics platform:
// platform admin, an agency owner, an agency staff member, or a merchant.
export async function resolveSession() {
  const user = await base44.auth.me().catch(() => null);
  if (!user) return { user: null, role: 'guest', tenant: null, member: null, isSuperAdmin: false };

  const isSuperAdmin = user.role === 'admin';

  const [ownedTenants, memberships] = await Promise.all([
    base44.entities.Tenant.filter({ owner_email: user.email }),
    base44.entities.TeamMember.filter({ email: user.email }),
  ]);

  // An agency manager keeps their agency workspace even when they also hold
  // platform admin rights, so the portal is never rendered without a tenant.
  const owned = ownedTenants[0];
  if (owned) return { user, role: 'tenant_admin', tenant: owned, member: null, isSuperAdmin };

  const member = memberships.find((m) => m.status !== 'suspended');
  if (member) {
    const tenant = await base44.entities.Tenant.get(member.tenant_id).catch(() => null);
    if (tenant) return { user, role: member.role, tenant, member, isSuperAdmin };
  }

  if (isSuperAdmin) return { user, role: 'super_admin', tenant: null, member: null, isSuperAdmin: true };

  return { user, role: 'merchant', tenant: null, member: null, isSuperAdmin: false };
}

// Every tenant-scoped record carries the emails that may read it, which is what
// powers the row-level security scoping. Keep it in sync on every create.
export function scopeFor(tenant, userEmail) {
  return {
    tenant_id: tenant.id,
    member_emails: Array.from(
      new Set([tenant.owner_email, ...(tenant.member_emails || []), userEmail].filter(Boolean))
    ),
  };
}

// The email list on a record is its access list. These collections belong to a
// subset of the staff, so they are written with only those roles' emails and the
// data layer itself keeps everyone else out — not just the sidebar.
export const ROLE_SCOPED_ENTITIES = {
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

export async function scopeForEntity(tenant, entityName, userEmail) {
  const roles = ROLE_SCOPED_ENTITIES[entityName];
  if (!roles) return scopeFor(tenant, userEmail);

  const members = await base44.entities.TeamMember.filter({ tenant_id: tenant.id });
  const allowed = members
    .filter((member) => member.status !== 'suspended' && roles.includes(member.role))
    .map((member) => member.email);

  return {
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    member_emails: Array.from(new Set([tenant.owner_email, ...allowed, userEmail].filter(Boolean))),
  };
}

export async function tenantScope(tenant) {
  if (!tenant) return {};
  const members = await base44.entities.TeamMember.filter({ tenant_id: tenant.id });
  const emails = [tenant.owner_email, ...(tenant.member_emails || []), ...members.map((m) => m.email)].filter(
    Boolean
  );
  return {
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    member_emails: Array.from(new Set(emails)),
  };
}