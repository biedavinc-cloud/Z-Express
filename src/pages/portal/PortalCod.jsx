import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, Banknote } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/logistics';

const FILTERS = ['all', 'pending', 'collected', 'settled', 'disputed'];

export default function PortalCod() {
  const { tenant, t, session } = useOutletContext();
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ pending: 0, collected: 0, settled: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Mirrors the server rules, so a role without cash rights never sees a dead button.
  const canCollect = ['tenant_admin', 'billing_manager', 'dispatcher'].includes(session?.role || '');
  const canSettle = ['tenant_admin', 'billing_manager'].includes(session?.role || '');

  const load = async () => {
    const [rows, page] = await Promise.all([
      api.entities.CodEntry.aggregate({ query: { tenant_id: tenant.id }, groupBy: 'status', sum: 'amount' }),
      api.entities.CodEntry.filter(
        filter === 'all' ? { tenant_id: tenant.id } : { tenant_id: tenant.id, status: filter },
        { sort: '-created_date', limit: 60 }
      ),
    ]);
    const next = { pending: 0, collected: 0, settled: 0 };
    (rows?.rows || []).forEach((row) => {
      if (next[row.status] !== undefined) next[row.status] += row.sum_amount || 0;
    });
    setTotals(next);
    setEntries(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id, filter]);

  // Cash moves through the server, never straight from the browser: the agency's
  // role rules and the ledger stage are both checked before anything is written.
  const mark = async (entry, status) => {
    setBusy(true);
    setError('');
    const response = await api.functions.invoke('shipmentOps', {
      action: 'cod',
      shipment_id: entry.shipment_id,
      cod_status: status,
    });
    const result = response?.data || {};
    if (result.error) {
      setError(
        result.code === 'forbidden'
          ? t('cod.errForbidden')
          : result.code === 'invalid_transition'
            ? t('cod.errTransition')
            : result.error || t('cod.errGeneric')
      );
    }
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
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('cod.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('cod.pending')} · {t('cod.collected')} · {t('cod.settled')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
            <Banknote className="h-5 w-5" />
          </span>
          <p className="mt-5 font-heading text-2xl font-semibold text-primary">
            {formatMoney(totals.pending, tenant.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('cod.outstanding')}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </span>
          <p className="mt-5 font-heading text-2xl font-semibold text-primary">
            {formatMoney(totals.collected, tenant.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('cod.collected')}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
            <Banknote className="h-5 w-5" />
          </span>
          <p className="mt-5 font-heading text-2xl font-semibold text-primary">
            {formatMoney(totals.settled, tenant.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('cod.settled')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {key === 'all' ? t('common.all') : t(`cod.${key}`)}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('ship.track')}</th>
                <th className="px-6 py-3 font-medium">{t('ship.driverCol')}</th>
                <th className="px-6 py-3 font-medium">{t('common.amount')}</th>
                <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                <th className="px-6 py-3 font-medium">{t('common.date')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('cod.noEntries')}
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 font-mono text-xs text-primary">{entry.tracking_number}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{entry.driver_email || '—'}</td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {formatMoney(entry.amount, entry.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        entry.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.status === 'collected'
                            ? 'bg-primary/10 text-primary'
                            : entry.status === 'disputed'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {t(`cod.${entry.status}`)}
                    </span>
                    {entry.settled_by && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {t('cod.settledBy')}: {entry.settled_by}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {formatDate(entry.collected_at || entry.created_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {canCollect && entry.status === 'pending' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => mark(entry, 'collected')}
                          className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-medium text-primary-foreground"
                        >
                          {t('cod.markCollected')}
                        </button>
                      )}
                      {canSettle && entry.status === 'collected' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => mark(entry, 'settled')}
                          className="rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-medium text-accent-foreground"
                        >
                          {t('cod.settle')}
                        </button>
                      )}
                    </div>
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