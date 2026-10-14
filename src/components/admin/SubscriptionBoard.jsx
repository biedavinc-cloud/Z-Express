import React from 'react';
import { Banknote, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate, formatMoney } from '@/lib/logistics';

const PLAN_IDS = ['starter', 'pro', 'enterprise'];
const CYCLES = ['monthly', 'yearly'];
const SUB_STATUS = ['trialing', 'active', 'past_due', 'cancelled'];

export default function SubscriptionBoard({ subscriptions, invoices, busy, onSave, onIssue, onPaid }) {
  const { t } = useI18n();
  const mrr = subscriptions
    .filter((sub) => sub.status === 'active')
    .reduce((total, sub) => total + (sub.amount || 0), 0);
  const collected = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((total, invoice) => total + (invoice.amount || 0), 0);
  const pending = invoices.filter((invoice) => invoice.status === 'pending');

  const cards = [
    { icon: TrendingUp, label: t('admin.mrr'), value: formatMoney(mrr, 'USD') },
    { icon: CreditCard, label: t('admin.activeSubs'), value: subscriptions.filter((s) => s.status === 'active').length },
    { icon: Banknote, label: t('admin.collected'), value: formatMoney(collected, 'USD') },
    { icon: Receipt, label: t('admin.pendingInvoices'), value: pending.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-none border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/12 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-5 font-heading text-2xl font-semibold text-primary">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-none border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('sub.title')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('admin.subsBody')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.company')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.plan')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.billingCycle')}</th>
                <th className="px-6 py-3 font-medium">{t('sub.status')}</th>
                <th className="px-6 py-3 font-medium">{t('sub.renews')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">{sub.tenant_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(sub.amount, sub.currency || 'USD')} · {t('sub.seats')}: {sub.seats || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={sub.plan || 'starter'}
                      disabled={busy}
                      onChange={(event) => onSave(sub, { plan: event.target.value })}
                      className="rounded-none border border-input bg-card px-2.5 py-1.5 text-xs capitalize outline-none focus:border-accent"
                    >
                      {PLAN_IDS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={sub.billing_cycle || 'monthly'}
                      disabled={busy}
                      onChange={(event) => onSave(sub, { billing_cycle: event.target.value })}
                      className="rounded-none border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                    >
                      {CYCLES.map((cycle) => (
                        <option key={cycle} value={cycle}>
                          {cycle === 'yearly' ? t('admin.yearly') : t('admin.monthly')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={sub.status || 'trialing'}
                      disabled={busy}
                      onChange={(event) => onSave(sub, { status: event.target.value })}
                      className="rounded-none border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                    >
                      {SUB_STATUS.map((status) => (
                        <option key={status} value={status}>
                          {t(`sub.status.${status}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {formatDate(sub.current_period_end, false)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => onIssue(sub)}>
                        <Receipt className="mr-1.5 h-3.5 w-3.5" />
                        {t('admin.issueInvoice')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-none border border-border bg-card">
        <h2 className="border-b border-border px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('admin.invoices')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.invoiceNumber')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.company')}</th>
                <th className="px-6 py-3 font-medium">{t('ship.amount')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.periodEnd')}</th>
                <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-sm text-muted-foreground">
                    {t('admin.noInvoices')}
                  </td>
                </tr>
              )}
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{invoice.number}</td>
                  <td className="px-6 py-4 font-medium text-primary">{invoice.tenant_name || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatMoney(invoice.amount, invoice.currency || 'USD')}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{invoice.period_end}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : invoice.status === 'failed'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      {invoice.status !== 'paid' && (
                        <Button size="sm" disabled={busy} onClick={() => onPaid(invoice)}>
                          {t('admin.markPaid')}
                        </Button>
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