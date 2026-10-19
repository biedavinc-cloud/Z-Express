import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function PortalTeam() {
  const { tenant, t } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'driver' });
  const [error, setError] = useState('');

  const load = async () => {
    const list = await api.entities.TeamMember.filter({ tenant_id: tenant.id }, { sort: 'full_name', limit: 100 });
    setMembers(list.items || list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const add = async () => {
    if (!form.email) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.functions.invoke('teamMember', { action: 'add', tenant_id: tenant.id, ...form });
      const result = response?.data || {};
      if (result.error) {
        // The plan pays for a number of users and extra ones are bought from the
        // subscription page, so that allowance is what stops the addition.
        setError(result.code === 'seat_limit' ? t('team.seatLimit', { count: result.seats }) : result.error);
        return;
      }
      setForm({ full_name: '', email: '', phone: '', role: 'driver' });
      setShow(false);
      load();
    } catch (err) {
      // A refused addition comes back as an error response, so the quota message is
      // read from it rather than from the transport error.
      const detail = err?.response?.data || err?.data || {};
      setError(
        detail.code === 'seat_limit' ? t('team.seatLimit', { count: detail.seats }) : err.message || t('common.error')
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member) => {
    setBusy(true);
    await api.functions.invoke('teamMember', { action: 'remove', tenant_id: tenant.id, email: member.email });
    setBusy(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('team.title')}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 text-accent" />
            {t('team.hint')}
          </p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setShow(true);
          }}
          className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('team.add')}
        </Button>
      </div>

      {show && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              placeholder={t('common.name')}
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              placeholder={t('team.email')}
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder={t('common.phone')}
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {['driver', 'dispatcher', 'hub_supervisor', 'tenant_admin'].map((role) => (
                <option key={role} value={role}>
                  {t(`team.roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={add} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setError('');
                setShow(false);
              }}
              className="rounded-xl"
            >
              {t('common.cancel')}
            </Button>
          </div>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('common.name')}</th>
                <th className="px-6 py-3 font-medium">{t('team.role')}</th>
                <th className="px-6 py-3 font-medium">{t('common.phone')}</th>
                <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('team.noMembers')}
                  </td>
                </tr>
              )}
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{t(`team.roles.${member.role}`)}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{member.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        member.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {t(`team.status.${member.status || 'invited'}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => remove(member)}
                      disabled={busy || member.email === tenant.owner_email}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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