import React from 'react';
import { useI18n } from '@/components/LanguageProvider';
import PricingTable from '@/components/pricing/PricingTable';
import { PLANS, formatMoney } from '@/lib/logistics';

export default function PlanStep({ form, setForm, cycle, setCycle }) {
  const { t } = useI18n();
  const plan = PLANS.find((entry) => entry.id === form.plan) || PLANS[0];
  const price = cycle === 'yearly' ? plan.yearly : plan.monthly;

  return (
    <div className="space-y-6">
      <PricingTable
        cycle={cycle}
        onCycleChange={setCycle}
        selected={form.plan}
        onSelect={(id) => setForm((prev) => ({ ...prev, plan: id }))}
      />

      <p className="rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        {t('onboard.trial')}
      </p>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('onboard.review')}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('onboard.companyName')}</dt>
            <dd className="text-sm font-medium text-primary">{form.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('onboard.country')}</dt>
            <dd className="text-sm font-medium text-primary">
              {form.city ? `${form.city}, ${form.country}` : form.country}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('onboard.trackingPrefix')}</dt>
            <dd className="font-mono text-sm font-medium uppercase text-primary">{form.tracking_prefix || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('onboard.plan')}</dt>
            <dd className="text-sm font-medium text-primary">
              {t(`biz.plan.${plan.id}`)} · {formatMoney(price, plan.currency)}{' '}
              {t(cycle === 'yearly' ? 'pricing.perYear' : 'pricing.perMonth')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}