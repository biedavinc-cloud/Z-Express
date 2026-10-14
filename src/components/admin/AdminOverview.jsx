import React from 'react';
import { Building2, Check, ClipboardCheck, FolderOpen, Package, Receipt, ShieldCheck, TrendingUp } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate, formatMoney } from '@/lib/logistics';
import { kycClass, kycKey } from '@/lib/documents';

export default function AdminOverview({ stats, tenants, invoices, canOpen, onOpenCompany }) {
  const { t } = useI18n();

  const cards = [
    { icon: Building2, label: t('admin.totalTenants'), value: tenants.length },
    { icon: Package, label: t('admin.activeShipments'), value: stats.active },
    { icon: Check, label: t('admin.deliveredWeek'), value: stats.delivered },
    { icon: TrendingUp, label: t('admin.mrr'), value: formatMoney(stats.mrr, 'USD') },
  ];

  // Companies a platform decision is waiting on: a pending account or a file
  // the team still has to review.
  const needsReview = tenants.filter(
    (tenant) => tenant.status === 'pending' || ['pending', 'rejected'].includes(tenant.kyc_status)
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/12 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-5 font-heading text-2xl font-semibold text-primary">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              {t('admin.needsReview')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('admin.needsReviewBody')}</p>
          </div>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold text-accent">
            {needsReview.length}
          </span>
        </div>

        {needsReview.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('admin.nothingPending')}</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {needsReview.slice(0, 6).map((tenant) => (
              <div key={tenant.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-primary">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[tenant.city, tenant.country].filter(Boolean).join(', ') || '—'} · {tenant.owner_email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kycClass(tenant.kyc_status)}`}>
                    {t(kycKey(tenant.kyc_status))}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{tenant.status}</span>
                  {canOpen && (
                    <button
                      type="button"
                      onClick={() => onOpenCompany(tenant.id)}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium text-primary transition hover:border-accent"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-accent" />
                      {t('admin.openFile')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="border border-border bg-card p-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.countryBreakdown')}
          </h2>
          <div className="mt-4 space-y-4">
            {stats.byCountry.length === 0 && <p className="text-sm text-muted-foreground">{t('common.noData')}</p>}
            {stats.byCountry.map((row) => (
              <div key={row.receiver_country || 'unknown'}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary">{row.receiver_country || '—'}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(100, (row.count / Math.max(1, stats.byCountry[0]?.count || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Receipt className="h-4 w-4" />
              {t('admin.invoices')}
            </h2>
            <div className="mt-4 divide-y divide-border">
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">{t('admin.noInvoices')}</p>}
              {invoices.slice(0, 6).map((invoice) => (
                <div key={invoice.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-primary">{invoice.tenant_name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatMoney(invoice.amount, invoice.currency || 'USD')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.number} · {invoice.status} · {formatDate(invoice.issued_at, false)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-accent/40 bg-accent/5 p-6">
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {t('admin.security')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('admin.securityBody')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}