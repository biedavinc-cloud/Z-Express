import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { PLAN_FEATURE_KEYS, formatMoney } from '@/lib/logistics';
import { PAYMENT_METHODS, PLANS, TRIAL_DAYS } from '@/lib/pricing';

// The plan table shared by the onboarding picker, the portal subscription page and
// the public business page. It can either act on a selection (onChoose/onSelect) or
// link away (ctaTo).
export default function PricingTable({
  cycle = 'monthly',
  onCycleChange,
  selected,
  onSelect,
  onChoose,
  ctaTo,
  currentPlan,
  className = '',
}) {
  const { t } = useI18n();
  const yearly = cycle === 'yearly';

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
          {['monthly', 'yearly'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onCycleChange?.(value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                cycle === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {t(`pricing.${value}`)}
              {value === 'yearly' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    cycle === 'yearly' ? 'bg-accent text-accent-foreground' : 'bg-accent/15 text-accent'
                  }`}
                >
                  {t('pricing.saveBadge')}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/12 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          {t('pricing.trialBadge')}
        </span>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          const saving = plan.monthly * 12 - plan.yearly;
          const isCurrent = currentPlan === plan.id;
          const active = selected === plan.id || isCurrent;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-7 transition ${
                plan.popular ? 'border-accent bg-accent/[0.04]' : 'border-border bg-card'
              } ${active ? 'ring-2 ring-accent/25' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  {t('pricing.popular')}
                </span>
              )}

              <h3 className="font-heading text-lg font-semibold text-primary">{t(`biz.plan.${plan.id}`)}</h3>
              <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">{t(`biz.plan.${plan.id}.desc`)}</p>

              <div className="mt-5 flex items-end gap-2">
                <span className="font-heading text-4xl font-semibold tracking-tight text-primary">
                  {formatMoney(price, plan.currency)}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">
                  {t(yearly ? 'pricing.perYear' : 'pricing.perMonth')}
                </span>
              </div>

              {yearly ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('pricing.billedYearly', { amount: formatMoney(price, plan.currency) })} ·{' '}
                  <span className="font-semibold text-accent">
                    {t('pricing.equiv', { amount: formatMoney(price / 12, plan.currency) })}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">{t('pricing.cancelAnytime')}</p>
              )}

              {yearly && (
                <span className="mt-3 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  {t('pricing.youSave', { amount: formatMoney(saving, plan.currency) })}
                </span>
              )}

              <p className="mt-4 text-xs font-medium text-primary">{t('pricing.seats', { count: plan.seats })}</p>

              <ul className="mt-4 flex-1 space-y-2.5">
                {(PLAN_FEATURE_KEYS[plan.id] || []).map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full">
                    {t('pricing.current')}
                  </Button>
                ) : ctaTo ? (
                  <Button
                    asChild
                    className={`w-full ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                  >
                    <Link to={ctaTo(plan)}>{t('pricing.choose', { plan: t(`biz.plan.${plan.id}`) })}</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => (onChoose ? onChoose(plan) : onSelect?.(plan.id))}
                    className={`w-full ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                  >
                    {t('pricing.choose', { plan: t(`biz.plan.${plan.id}`) })}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 px-5 py-4">
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          {t('pricing.trialNote', { days: TRIAL_DAYS })} {t('pricing.noFees')}{' '}
          {t('pricing.currencyNote')}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{t('pricing.payWith')}</span>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                {t(`pay.method.${method}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}