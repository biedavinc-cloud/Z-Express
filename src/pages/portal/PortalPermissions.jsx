import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, UserPlus, ShieldCheck, Check } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { PERMISSION_MODULES, PERMISSION_ROLES, PERMISSION_LEVEL_KEY } from '@/lib/permissions';

const field =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const BLANK = { full_name: '', email: '', phone: '', role: 'driver', hub_id: '' };

export default function PortalPermissions() {
  const { tenant, t } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [draft, setDraft] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [memberList, hubList] = await Promise.all([
      api.entities.TeamMember.filter({ tenant_id: tenant.id }, { sort: 'full_name', limit: 100 }),
      api.entities.Hub.filter({ tenant_id: tenant.id, status: 'active' }, { sort: 'name', limit: 50 }),
    ]);
    setMembers(memberList.items || []);
    setHubs(hubList.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const call = async (payload, message) => {
    setBusy(true);
    await api.functions.invoke('teamMember', { action: 'add', tenant_id: tenant.id, ...payload });
    setBusy(false);
    if (message) toast({ title: message });
    load();
  };

  const invite = async () => {
    if (!draft.email.includes('@')) return;
    await call(draft, t('perm.invited'));
    setDraft({ ...BLANK });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const cell = 'px-4 py-3';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('perm.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('perm.subtitle')}</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          {t('perm.invite')}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{t('perm.name')}</Label>
            <input
              className={field}
              value={draft.full_name}
              onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('perm.email')}</Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('perm.phone')}</Label>
            <input
              className={field}
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('perm.role')}</Label>
            <select
              className={field}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            >
              {PERMISSION_ROLES.map((role) => (
                <option key={role} value={role}>{t(`role.${role}`)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t('perm.hub')}</Label>
            <select
              className={field}
              value={draft.hub_id}
              onChange={(e) => setDraft({ ...draft, hub_id: e.target.value })}
            >
              <option value="">—</option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>{hub.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={invite}
              disabled={busy}
              className="w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {busy ? t('perm.sending') : t('perm.send')}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t('perm.roleHint')}</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className={cell}>{t('perm.members')}</th>
              <th className={cell}>{t('perm.role')}</th>
              <th className={cell}>{t('logs.colStatus')}</th>
              <th className={cell}>{t('perm.change')}</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td className={`${cell} text-muted-foreground`} colSpan={4}>
                  {t('perm.empty')}
                </td>
              </tr>
            )}
            {members.map((member) => {
              const suspended = member.status === 'suspended';
              return (
                <tr key={member.id} className="border-t border-border/60">
                  <td className={cell}>
                    <p className="font-medium text-primary">{member.full_name || member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </td>
                  <td className={`${cell} text-muted-foreground`}>{t(`role.${member.role}`)}</td>
                  <td className={cell}>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        suspended
                          ? 'bg-destructive/10 text-destructive'
                          : member.status === 'invited'
                          ? 'bg-accent/12 text-accent'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {suspended
                        ? t('perm.suspended')
                        : member.status === 'invited'
                        ? t('perm.invitedStatus')
                        : t('perm.activeStatus')}
                    </span>
                  </td>
                  <td className={cell}>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs outline-none"
                        value={member.role}
                        onChange={(e) =>
                          call(
                            {
                              email: member.email,
                              full_name: member.full_name,
                              phone: member.phone,
                              hub_id: member.hub_id,
                              role: e.target.value,
                            },
                            t('perm.roleSaved')
                          )
                        }
                      >
                        {PERMISSION_ROLES.map((role) => (
                          <option key={role} value={role}>{t(`role.${role}`)}</option>
                        ))}
                      </select>
                      {suspended ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          disabled={busy}
                          onClick={() =>
                            call(
                              {
                                email: member.email,
                                full_name: member.full_name,
                                phone: member.phone,
                                hub_id: member.hub_id,
                                role: member.role,
                              },
                              t('perm.activate')
                            )
                          }
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t('perm.activate')}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-destructive"
                          disabled={busy}
                          onClick={() => call({ email: member.email, action: 'remove' })}
                        >
                          {t('perm.suspend')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {t('perm.matrix')}
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">{t('perm.module')}</th>
                {PERMISSION_ROLES.map((role) => (
                  <th key={role} className="px-3 py-2 text-center">
                    {t(`role.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MODULES.map((module) => (
                <tr key={module.key} className="border-t border-border/60">
                  <td className="py-2.5 pr-4 text-primary">{t(module.key)}</td>
                  {PERMISSION_ROLES.map((role) => {
                    const level = module[role] || 'none';
                    return (
                      <td key={role} className="px-3 py-2.5 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            level === 'full'
                              ? 'bg-emerald-100 text-emerald-800'
                              : level === 'write'
                              ? 'bg-accent/12 text-accent'
                              : level === 'read'
                              ? 'bg-secondary text-muted-foreground'
                              : 'text-muted-foreground/50'
                          }`}
                        >
                          {t(PERMISSION_LEVEL_KEY[level])}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}