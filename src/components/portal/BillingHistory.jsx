import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/logistics';

const STATUS_CLASS = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-accent/15 text-accent',
  failed: 'bg-destructive/10 text-destructive',
};

export default function BillingHistory({ tenantId, t }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Invoice.filter({ tenant_id: tenantId }, { sort: '-issued_at', limit: 24 })
      .then((page) => {
        setInvoices(page.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('bill.title')}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">{t('bill.number')}</th>
              <th className="px-6 py-3 font-medium">{t('bill.period')}</th>
              <th className="px-6 py-3 font-medium">{t('bill.issued')}</th>
              <th className="px-6 py-3 font-medium">{t('bill.amount')}</th>
              <th className="px-6 py-3 font-medium">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </span>
                </td>
              </tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-sm text-muted-foreground">
                  {t('bill.none')}
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 font-mono text-xs font-medium text-primary">{invoice.number}</td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {invoice.period_start} → {invoice.period_end}
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {formatDate(invoice.issued_at, false)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-primary">
                  {formatMoney(invoice.amount, invoice.currency)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      STATUS_CLASS[invoice.status] || STATUS_CLASS.pending
                    }`}
                  >
                    {t(`bill.status.${invoice.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}