// Who the caller is inside one agency: platform admin, the agency owner, or the
// staff role recorded on their team member row. Shared so every privileged
// endpoint resolves access exactly the same way.

export async function resolveTenantActor(service, user, tenantId) {
  const tenant = await service.entities.Tenant.get(tenantId).catch(() => null);
  if (!tenant) return { error: 'Tenant not found', code: 'tenant_not_found', status: 404 };
  if (user.role === 'admin') return { tenant, role: 'platform_admin', member: null };
  if (tenant.owner_email === user.email) return { tenant, role: 'tenant_admin', member: null };

  const rows = await service.entities.TeamMember.filter({ tenant_id: tenantId, email: user.email });
  const members = Array.isArray(rows) ? rows : rows.items || [];
  const member = members.find((row) => row.status !== 'suspended');
  if (!member) return { error: 'Forbidden', code: 'forbidden', status: 403 };

  return { tenant, role: member.role, member };
}