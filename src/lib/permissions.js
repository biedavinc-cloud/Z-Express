// Role matrix shown on the permissions page. It mirrors the sidebar rules, so
// what the table promises is exactly what each role can reach.
// levels: full = create and edit, write = operate, read = view only, none.
export const PERMISSION_ROLES = [
  'tenant_admin',
  'hub_supervisor',
  'dispatcher',
  'billing_manager',
  'driver',
];

export const PERMISSION_MODULES = [
  { key: 'portal.overview', tenant_admin: 'full', hub_supervisor: 'full', dispatcher: 'full', billing_manager: 'read', driver: 'none' },
  { key: 'portal.shipments', tenant_admin: 'full', hub_supervisor: 'full', dispatcher: 'full', billing_manager: 'none', driver: 'read' },
  { key: 'portal.dispatch', tenant_admin: 'full', hub_supervisor: 'full', dispatcher: 'full', billing_manager: 'none', driver: 'none' },
  { key: 'portal.fleet', tenant_admin: 'full', hub_supervisor: 'full', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.pricing', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.cod', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'write', billing_manager: 'read', driver: 'none' },
  { key: 'portal.hubs', tenant_admin: 'full', hub_supervisor: 'full', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.api', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.webhooks', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.marketplaces', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.analytics', tenant_admin: 'full', hub_supervisor: 'read', dispatcher: 'none', billing_manager: 'read', driver: 'none' },
  { key: 'portal.merchants', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.tickets', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'full', billing_manager: 'none', driver: 'none' },
  { key: 'portal.settings', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.subscription', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'full', driver: 'none' },
  { key: 'portal.permissions', tenant_admin: 'full', hub_supervisor: 'none', dispatcher: 'none', billing_manager: 'none', driver: 'none' },
  { key: 'portal.driverApp', tenant_admin: 'read', hub_supervisor: 'read', dispatcher: 'read', billing_manager: 'none', driver: 'full' },
];

export const PERMISSION_LEVEL_KEY = {
  full: 'perm.full',
  write: 'perm.write',
  read: 'perm.read',
  none: 'perm.none',
};