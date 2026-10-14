import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';

const NEXT_STEPS = [
  { key: 'onboard.nextStep1', to: '/portal/hubs' },
  { key: 'onboard.nextStep2', to: '/portal/pricing' },
  { key: 'onboard.nextStep3', to: '/portal/team' },
  { key: 'onboard.nextStep4', to: '/portal/api' },
];

export default function SuccessPanel({ tenant }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
          <Check className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-semibold text-primary sm:text-3xl">
          {t('onboard.createdTitle')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('onboard.createdBody')}</p>
        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-accent" />
          {t('onboard.pending')}
        </p>
        <p className="mt-5 font-heading text-sm font-semibold text-primary">{tenant.name}</p>
        <Button asChild className="mt-7 rounded-2xl bg-accent px-8 text-accent-foreground hover:bg-accent/90">
          <Link to="/portal">
            {t('onboard.goToPortal')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('onboard.nextSteps')}
        </h2>
        <ol className="mt-5 space-y-3">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.key}>
              <Link
                to={step.to}
                className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-primary transition hover:border-accent/60"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                {t(step.key)}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}