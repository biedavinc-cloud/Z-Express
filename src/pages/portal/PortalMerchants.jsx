import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { ArrowRight, Copy, KeyRound, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/logistics';

export default function PortalMerchants() {
  const { tenant, t } = useOutletContext();
  const [merchants, setMerchants] = useState([]);
  const [delivered, setDelivered] = useState({});
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [totals, done, apiKeys] = await Promise.all([
        api.entities.Shipment.aggregate({
          query: { tenant_id: tenant.id },
          groupBy: 'merchant_email',
          sum: 'total_amount',
          sort: '-sum_total_amount',
          limit: 30,
        }),
        api.entities.Shipment.aggregate({
          query: { tenant_id: tenant.id, status: 'delivered' },
          groupBy: 'merchant_email',
        }),
        api.entities.ApiKey.filter({ tenant_id: tenant.id }, { sort: '-created_date', limit: 20 }),
      ]);
      if (cancelled) return;
      setMerchants((totals?.rows || []).filter((row) => row.merchant_email));
      setDelivered(
        Object.fromEntries((done?.rows || []).filter((r) => r.merchant_email).map((r) => [r.merchant_email, r.count || 0]))
      );
      setKeys(apiKeys.items || apiKeys);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  const invite = async (email) => {
    setMessage('');
    try {
      await api.users.inviteUser(email, 'user');
      setMessage(`${t('merch.invited')} · ${email}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const copy = (value) => {
    navigator.clipboard?.writeText(value);
    setCopied(value);
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('merch.title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('merch.subtitle')}</p>
      </div>

      {message && <p className="rounded-2xl bg-secondary px-5 py-3 text-sm text-primary">{message}</p>}

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('tickets.merchant')}</th>
                <th className="px-6 py-3 font-medium">{t('merch.volume')}</th>
                <th className="px-6 py-3 font-medium">{t('merch.delivered')}</th>
                <th className="px-6 py-3 font-medium">{t('merch.revenue')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('merch.none')}
                  </td>
                </tr>
              )}
              {merchants.map((row) => (
                <tr key={row.merchant_email}>
                  <td className="px-6 py-4 font-medium text-primary">{row.merchant_email}</td>
                  <td className="px-6 py-4 text-sm text-primary">{row.count}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{delivered[row.merchant_email] || 0}</td>
                  <td className="px-6 py-4 text-sm text-primary">
                    {formatMoney(row.sum_total_amount, tenant.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => invite(row.merchant_email)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-[11px] font-medium text-primary transition hover:bg-accent/15"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {t('merch.invite')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <KeyRound className="h-4 w-4" />
            {t('merch.keys')}
          </h2>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/portal/api">
              {t('api.title')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-5 space-y-3">
          {keys.length === 0 && <p className="text-sm text-muted-foreground">{t('merch.noKeys')}</p>}
          {keys.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{key.label || '—'}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {key.key_prefix}•••• · {t('api.calls')}: {key.call_count || 0} · {formatDate(key.last_used_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy(key.api_key)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-accent"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied === key.api_key && <span className="text-[11px] text-emerald-700">{t('common.copied')}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}