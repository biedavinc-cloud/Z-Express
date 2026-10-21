import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import CompanyRow from '@/components/admin/CompanyRow';

const STATUSES = [
  { id: 'all', key: 'admin.filterAll' },
  { id: 'pending', key: 'admin.filterPending' },
  { id: 'active', key: 'admin.filterActive' },
  { id: 'suspended', key: 'admin.filterSuspended' },
];

export default function CompanyTable({
  tenants,
  staffCounts,
  shipmentCounts,
  subscriptions,
  busy,
  query,
  onFilter,
  onOpen,
  onStatus,
  onPlan,
}) {
  const { t } = useI18n();
  const [term, setTerm] = useState(query.search);
  const subscriptionFor = (tenantId) => subscriptions.find((sub) => sub.tenant_id === tenantId);

  const search = (event) => {
    event.preventDefault();
    onFilter({ ...query, search: term });
  };

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('admin.companies')}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('admin.companiesBody')}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form onSubmit={search} className="flex flex-1 items-center gap-2 sm:min-w-[320px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t('admin.searchPlaceholder')}
                className="h-10 w-full border border-input bg-transparent pl-10 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <Button type="submit" size="sm" disabled={busy}>
              {t('admin.search')}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status.id}
                type="button"
                disabled={busy}
                onClick={() => onFilter({ ...query, status: status.id })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  query.status === status.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-primary'
                }`}
              >
                {t(status.key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">{t('common.name')}</th>
              <th className="px-6 py-3 font-medium">{t('common.country')}</th>
              <th className="px-6 py-3 font-medium">{t('admin.plan')}</th>
              <th className="px-6 py-3 font-medium">{t('admin.staffCount')}</th>
              <th className="px-6 py-3 font-medium">{t('admin.kyc')}</th>
              <th className="px-6 py-3 font-medium">{t('admin.subscription')}</th>
              <th className="px-6 py-3 font-medium">{t('common.status')}</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-sm text-muted-foreground">
                  {t('admin.noTenants')}
                </td>
              </tr>
            )}
            {tenants.map((tenant) => (
              <CompanyRow
                key={tenant.id}
                tenant={tenant}
                staffCount={staffCounts[tenant.id]}
                shipmentCount={shipmentCounts[tenant.id]}
                subscription={subscriptionFor(tenant.id)}
                busy={busy}
                onOpen={onOpen}
                onStatus={onStatus}
                onPlan={onPlan}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}