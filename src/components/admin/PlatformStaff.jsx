import React, { useState } from 'react';
import { Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate } from '@/lib/logistics';

export default function PlatformStaff({ users, roles, busy, onInvite, onRole, onPlatformRole }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const admins = users.filter((member) => member.role === 'admin');

  const invite = () => {
    if (!email.includes('@')) return;
    onInvite(email.trim().toLowerCase(), role);
    setEmail('');
    setRole('user');
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <UserPlus className="h-4 w-4" />
          {t('admin.inviteStaff')}
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@zexpress.africa"
              className="h-11 w-full border border-input bg-transparent pl-10 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-11 border border-input bg-card px-3 text-sm outline-none focus:border-accent"
          >
            <option value="user">{t('admin.roleUser')}</option>
            <option value="admin">{t('admin.roleAdmin')}</option>
          </select>
          <Button disabled={busy || !email.includes('@')} onClick={invite}>
            {t('admin.sendInvite')}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t('admin.assignHint')}</p>
      </div>

      <div className="overflow-hidden border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('admin.users')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('admin.staffBody')}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            {admins.length} {t('admin.roleAdmin')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('common.name')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.email')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.accountType')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.role')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.platformRole')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.joined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('admin.noUsers')}
                  </td>
                </tr>
              )}
              {users.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{member.full_name || member.display_name || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4 text-xs capitalize text-muted-foreground">
                    {member.account_type || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={member.role || 'user'}
                      disabled={busy}
                      onChange={(event) => onRole(member, event.target.value)}
                      className="border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                    >
                      <option value="user">{t('admin.roleUser')}</option>
                      <option value="admin">{t('admin.roleAdmin')}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={member.platform_role || ''}
                      disabled={busy || roles.length === 0}
                      onChange={(event) => onPlatformRole(member, event.target.value)}
                      className="max-w-[220px] border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                    >
                      <option value="">{t('admin.roleOwner')}</option>
                      {roles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {member.platform_role && (
                      <p className="mt-1 text-[11px] text-accent">
                        {(roles.find((item) => item.id === member.platform_role)?.permissions || []).length}{' '}
                        {t('admin.rolePermissions').toLowerCase()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {formatDate(member.created_date, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}