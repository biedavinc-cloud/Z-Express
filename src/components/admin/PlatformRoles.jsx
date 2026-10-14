import React, { useState } from 'react';
import { Check, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';

// Modules of the console a custom role can grant; they mirror the server-side
// check in the platform-admin function.
const MODULES = [
  { id: 'companies', key: 'admin.permissionCompanies' },
  { id: 'subscriptions', key: 'admin.permissionSubscriptions' },
  { id: 'invoices', key: 'admin.permissionInvoices' },
  { id: 'staff', key: 'admin.permissionStaff' },
];

export default function PlatformRoles({ roles, users, busy, onSave, onDelete }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(null);

  const assignedCount = (roleId) => users.filter((member) => member.platform_role === roleId).length;

  const togglePermission = (permission) =>
    setDraft((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));

  const submit = () => {
    if (!draft?.name?.trim()) return;
    onSave(draft);
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              {t('admin.roles')}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{t('admin.rolesBody')}</p>
          </div>
          <Button size="sm" disabled={busy} onClick={() => setDraft({ id: '', name: '', description: '', permissions: [] })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('admin.roleNew')}
          </Button>
        </div>

        {draft && (
          <div className="mt-5 border border-accent/40 bg-accent/5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder={t('admin.roleName')}
                className="h-10 w-full border border-input bg-card px-3 text-sm outline-none focus:border-accent"
              />
              <input
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder={t('admin.roleDescription')}
                className="h-10 w-full border border-input bg-card px-3 text-sm outline-none focus:border-accent"
              />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.rolePermissions')}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {MODULES.map((module) => {
                const active = draft.permissions.includes(module.id);
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => togglePermission(module.id)}
                    className={`flex items-center gap-2 border px-3 py-2.5 text-left text-xs font-medium transition ${
                      active
                        ? 'border-accent bg-accent/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center border ${
                        active ? 'border-accent bg-accent text-accent-foreground' : 'border-input'
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    {t(module.key)}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button size="sm" disabled={busy || !draft.name.trim()} onClick={submit}>
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t('admin.roleSave')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDraft(null)}>
                {t('admin.roleCancel')}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">{t('admin.permissionHint')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-accent/40 bg-accent/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold text-primary">{t('admin.roleOwner')}</h3>
            <span className="text-xs text-muted-foreground">
              {users.filter((member) => !member.platform_role).length} {t('admin.staffCount').toLowerCase()}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {MODULES.map((module) => (
              <span key={module.id} className="border border-accent/30 bg-card px-2.5 py-1 text-[11px] text-primary">
                {t(module.key)}
              </span>
            ))}
          </div>
        </div>

        {roles.map((role) => (
          <div key={role.id} className="border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-sm font-semibold text-primary">{role.name}</h3>
                {role.description && <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    setDraft({
                      id: role.id,
                      name: role.name,
                      description: role.description || '',
                      permissions: role.permissions || [],
                    })
                  }
                >
                  {t('admin.roleEdit')}
                </Button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(role)}
                  className="text-muted-foreground transition hover:text-destructive"
                  aria-label={t('admin.roleDelete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(role.permissions || []).length === 0 && (
                <span className="text-xs text-muted-foreground">{t('admin.roleNoPermission')}</span>
              )}
              {(role.permissions || []).map((permission) => (
                <span key={permission} className="border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-primary">
                  {t(`admin.permission${permission.charAt(0).toUpperCase()}${permission.slice(1)}`)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {assignedCount(role.id)
                ? `${assignedCount(role.id)} ${t('admin.roleAssigned')}`
                : t('admin.roleNone')}
            </p>
          </div>
        ))}

        {roles.length === 0 && (
          <div className="border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            {t('admin.noRoles')}
          </div>
        )}
      </div>
    </div>
  );
}