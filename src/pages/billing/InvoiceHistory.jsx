import React, { useEffect, useState } from 'react';
import { Loader2, FileText, Download, ChevronDown } from 'lucide-react';
import { api, escapeRegExp } from '@/api/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/components/LanguageProvider';
import StaffPage from '@/components/portal/StaffPage';
import MetricCard from '@/components/portal/MetricCard';
import useStaffScope from '@/hooks/useStaffScope';
import { formatMoney, formatDate } from '@/lib/logistics';
import { downloadInvoicePdf } from '@/lib/invoicePdf';

const STATUSES = ['pending', 'paid', 'failed'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const selectClass =
  'rounded-2xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function InvoiceHistory() {
  const { t } = useI18n();
  const scope = useStaffScope();
  const tenant = scope?.tenant || null;

  const [invoices, setInvoices] = useState([]);
  const [totals, setTotals] = useState({ paid: 0, pending: 0 });
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.id) return undefined;
    let cancelled = false;
    setLoading(true);

    const query = { tenant_id: tenant.id };
    if (status) query.status = status;
    if (year) {
      query.issued_at = { $gte: `${year}-01-01`, $lt: `${Number(year) + 1}-01-01` };
    }
    const term = search.trim();
    if (term) query.number = { $regex: escapeRegExp(term), $options: 'i' };

    Promise.all([
      api.entities.Invoice.filter(query, { sort: '-issued_at', limit: 50 }),
      api.entities.Invoice.aggregate({
        query: { tenant_id: tenant.id },
        groupBy: 'status',
        sum: 'amount',
      }),
    ]).then(([page, aggregate]) => {
      if (cancelled) return;
      setInvoices(page.items || []);
      const rows = aggregate.rows || [];
      setTotals({
        paid: rows.find((row) => row.status === 'paid')?.sum_amount || 0,
        pending: rows.find((row) => row.status === 'pending')?.sum_amount || 0,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tenant?.id, status, year, search]);

  const download = (invoice) => {
    try {
      downloadInvoicePdf(invoice, tenant?.name, {
        invoice: t('inv.colNumber'),
        billedTo: t('inv.billedTo'),
        plan: t('inv.colPlan'),
        colPeriod: t('inv.colPeriod'),
        seats: t('inv.seats'),
        colIssued: t('inv.colIssued'),
        colDue: t('inv.colDue'),
        colStatus: t('inv.colStatus'),
        method: t('inv.method'),
        colAmount: t('inv.colAmount'),
        generated: t('inv.generated', { date: '' }).trim(),
      });
    } catch {
      toast({ title: t('inv.downloadError') });
    }
  };

  const currency = invoices[0]?.currency || 'USD';
  const cell = 'px-4 py-3';

  return (
    <StaffPage title={t('inv.title')} subtitle={t('inv.subtitle')}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={FileText}
            label={t('inv.totalPaid')}
            value={formatMoney(totals.paid, currency)}
          />
          <MetricCard
            icon={Download}
            label={t('inv.totalPending')}
            value={formatMoney(totals.pending, currency)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inv.search')}
            className={`${selectClass} w-full max-w-xs`}
          />
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('inv.allStatus')}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>{t(`sub.status.${value}`)}</option>
            ))}
          </select>
          <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">{t('inv.allYears')}</option>
            {YEARS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <FileText className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{t('inv.empty')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('inv.count', { count: invoices.length })}
            </p>
            <div className="overflow-x-auto rounded-3xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className={cell}>{t('inv.colNumber')}</th>
                    <th className={cell}>{t('inv.colPlan')}</th>
                    <th className={cell}>{t('inv.colPeriod')}</th>
                    <th className={cell}>{t('inv.colAmount')}</th>
                    <th className={cell}>{t('inv.colStatus')}</th>
                    <th className={cell}>{t('inv.colIssued')}</th>
                    <th className={cell} />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const expanded = open === invoice.id;
                    return (
                      <React.Fragment key={invoice.id}>
                        <tr className="border-t border-border/60">
                          <td className={`${cell} font-mono text-xs text-primary`}>{invoice.number}</td>
                          <td className={`${cell} capitalize text-muted-foreground`}>{invoice.plan}</td>
                          <td className={`${cell} text-muted-foreground`}>
                            {invoice.period_start} → {invoice.period_end}
                          </td>
                          <td className={`${cell} font-heading font-semibold text-primary`}>
                            {formatMoney(invoice.amount, invoice.currency)}
                          </td>
                          <td className={cell}>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                invoice.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : invoice.status === 'failed'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-accent/12 text-accent'
                              }`}
                            >
                              {t(`sub.status.${invoice.status}`)}
                            </span>
                          </td>
                          <td className={`${cell} text-muted-foreground`}>
                            {formatDate(invoice.issued_at, false)}
                          </td>
                          <td className={cell}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setOpen(expanded ? '' : invoice.id)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`}
                                />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => download(invoice)}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                {t('inv.download')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="border-t border-border/40 bg-secondary/40">
                            <td className={`${cell} text-xs text-muted-foreground`} colSpan={7}>
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div>
                                  <p className="uppercase tracking-wider">{t('inv.colDue')}</p>
                                  <p className="mt-1 font-medium text-primary">{invoice.due_at || '—'}</p>
                                </div>
                                <div>
                                  <p className="uppercase tracking-wider">{t('inv.seats')}</p>
                                  <p className="mt-1 font-medium text-primary">{invoice.seats || '—'}</p>
                                </div>
                                <div>
                                  <p className="uppercase tracking-wider">{t('inv.method')}</p>
                                  <p className="mt-1 font-medium text-primary">{invoice.method || '—'}</p>
                                </div>
                                <div>
                                  <p className="uppercase tracking-wider">{t('inv.notes')}</p>
                                  <p className="mt-1 font-medium text-primary">{invoice.notes || '—'}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </StaffPage>
  );
}