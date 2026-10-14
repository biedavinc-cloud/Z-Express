import React from 'react';
import { Ban, FolderOpen, Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/logistics';
import { kycClass, kycKey } from '@/lib/documents';

const PLAN_IDS = ['starter', 'pro', 'enterprise'];

export default function CompanyRow({
  tenant,
  staffCount,
  shipmentCount,
  subscription,
  busy,
  onOpen,
  onStatus,
  onPlan,
}) {
  const { t } = useI18n();

  return (
    <tr className="align-top">
      <td className="px-6 py-4">
        <p className="font-medium text-primary">{tenant.name}</p>
        <p className="text-xs text-muted-foreground">{tenant.owner_email}</p>
        {tenant.legal_name && <p className="text-xs text-muted-foreground">{tenant.legal_name}</p>}
      </td>
      <td className="px-6 py-4 text-xs text-muted-foreground">
        {[tenant.city, tenant.country].filter(Boolean).join(', ') || '—'}
        {tenant.tracking_prefix && <span className="ml-1 font-mono">· {tenant.tracking_prefix}</span>}
      </td>
      <td className="px-6 py-4">
        <select
          value={tenant.plan || 'starter'}
          disabled={busy}
          onChange={(event) => onPlan(tenant, event.target.value)}
          className="border border-input bg-card px-2.5 py-1.5 text-xs capitalize outline-none focus:border-accent"
        >
          {PLAN_IDS.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">{formatMoney(tenant.monthly_fee, 'USD')}</p>
      </td>
      <td className="px-6 py-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-accent" />
          {staffCount || 0}
        </span>
        <span className="mt-1 block">
          {shipmentCount || 0} {t('admin.shipments').toLowerCase()}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kycClass(tenant.kyc_status)}`}>
          {t(kycKey(tenant.kyc_status))}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-muted-foreground">
        {subscription ? (
          <>
            <span className="capitalize text-primary">{subscription.plan}</span>
            <span className="mt-1 block">
              {t(`sub.status.${subscription.status}`)} · {formatMoney(subscription.amount, subscription.currency)}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">{t('common.noData')}</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            tenant.status === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : tenant.status === 'pending'
                ? 'bg-accent/15 text-accent'
                : 'bg-destructive/10 text-destructive'
          }`}
        >
          {tenant.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          {tenant.status !== 'active' ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onStatus(tenant, 'active')}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {t('admin.activate')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(tenant, 'suspended')}>
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              {t('admin.suspend')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onOpen(tenant.id)}>
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            {t('admin.openFile')}
          </Button>
        </div>
      </td>
    </tr>
  );
}