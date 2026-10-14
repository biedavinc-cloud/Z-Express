import React, { useState } from 'react';
import { Calculator, Minus, Plus, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/logistics';
import { EXTRA_SEAT_MONTHLY, PLANS, TRIAL_DAYS, quote } from '@/lib/pricing';

// Turns a plan, a billing cycle and extra users into the exact subscription total.
// The customer sees one figure — what the subscription costs — because the payment
// provider we collect it through is our own concern, never their charge.
const trialEnd = () => new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10);

export default function PricingCalculator({ initial = {}, onContinue, className = '' }) {
  const { t } = useI18n();
  const [planId, setPlanId] = useState(initial.planId || 'pro');
  const [cycle, setCycle] = useState(initial.cycle || 'monthly');
  const [extraSeats, setExtraSeats] = useState(initial.extraSeats || 0);

  const priced = quote({ planId, cycle, extraSeats });

  return (
    <section className={`rounded-3xl border border-border bg-card p-6 sm:p-8 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-primary">{t('calc.title')}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('calc.subtitle')}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('pricing.trialBadge')}
        </span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('calc.plan')}</p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanId(plan.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    planId === plan.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <span className="block font-heading text-sm font-semibold text-primary">
                    {t(`biz.plan.${plan.id}`)}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatMoney(plan.monthly, plan.currency)} {t('pricing.perMonth')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('calc.cycle')}
            </p>
            <div className="mt-2.5 inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
              {['monthly', 'yearly'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCycle(value)}
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
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('calc.extraSeats')}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setExtraSeats((value) => Math.max(0, value - 5))}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:text-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center font-heading text-sm font-semibold text-primary">
                  {extraSeats}
                </span>
                <button
                  type="button"
                  onClick={() => setExtraSeats((value) => Math.min(500, value + 5))}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
                {t('calc.seatsTotal', { count: priced.seats })}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('calc.extraSeatsHint', {
                count: priced.plan.seats,
                price: formatMoney(EXTRA_SEAT_MONTHLY, priced.currency),
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/60">
            {t('checkout.summary')}
          </p>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-primary-foreground/80">
                {t('calc.linePlan', {
                  plan: t(`biz.plan.${priced.plan.id}`),
                  cycle: t(`pricing.${cycle}`),
                })}
              </dt>
              <dd className="font-medium">{formatMoney(priced.monthlyList, priced.currency)}</dd>
            </div>
            {priced.extraSeats > 0 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-primary-foreground/80">{t('calc.lineExtra', { count: priced.extraSeats })}</dt>
                <dd className="font-medium">
                  {formatMoney(priced.extraSeats * EXTRA_SEAT_MONTHLY, priced.currency)}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-primary-foreground/15 pt-3">
              <dt className="text-primary-foreground/80">{t('calc.lineSubtotal')}</dt>
              <dd className="font-medium">{formatMoney(priced.subtotal, priced.currency)}</dd>
            </div>
            {priced.discount > 0 && (
              <div className="flex items-baseline justify-between gap-4 text-emerald-300">
                <dt>{t('calc.lineDiscount')}</dt>
                <dd className="font-medium">−{formatMoney(priced.discount, priced.currency)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 rounded-2xl bg-primary-foreground/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-primary-foreground/60">{t('calc.total')}</p>
            <p className="mt-1 font-heading text-3xl font-semibold text-accent">
              {formatMoney(priced.total, priced.currency)}
            </p>
            {cycle === 'yearly' && (
              <p className="mt-1.5 text-xs text-primary-foreground/80">
                {t('calc.monthlyEquivalent')}: {formatMoney(priced.monthlyEquivalent, priced.currency)}{' '}
                {t('pricing.perMonth')}
              </p>
            )}
            {priced.discount > 0 && (
              <p className="mt-1 text-xs text-emerald-300">
                {t('calc.saving', { amount: formatMoney(priced.discount, priced.currency) })}
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-primary-foreground/75">
            {t('calc.trialNote', {
              amount: formatMoney(priced.total, priced.currency),
              date: formatDate(trialEnd(), false),
            })}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-primary-foreground/60">
            {t('pricing.currencyNote')}
          </p>

          {onContinue && (
            <Button
              onClick={() => onContinue({ planId, cycle, extraSeats })}
              className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t('calc.continue')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}