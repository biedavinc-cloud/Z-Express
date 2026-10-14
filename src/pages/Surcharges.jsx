import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Receipt, Settings2 } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import InfoHero from '@/components/site/InfoHero';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { localized, localizedList } from '@/lib/localized';
import {
  RATE_EXAMPLE_LINES,
  RATE_EXAMPLE_TOTAL,
  RATE_STEPS,
  SURCHARGE_RULES,
} from '@/lib/surchargeGuide';

export default function Surcharges() {
  const { t, lang } = useI18n();

  return (
    <SiteShell>
      <InfoHero
        icon={Receipt}
        badge={t('sur.badge')}
        title={t('sur.title')}
        subtitle={t('sur.subtitle')}
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-primary">
          {t('sur.rulesTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t('sur.rulesSubtitle')}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {SURCHARGE_RULES.map((rule) => (
            <article key={rule.id} id={rule.id} className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-heading text-base font-semibold text-primary">
                {localized(rule.title, lang)}
              </h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {localizedList(rule.paragraphs, lang).map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-16 font-heading text-2xl font-semibold tracking-tight text-primary">
          {t('sur.buildTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t('sur.buildSubtitle')}
        </p>

        <ol className="mt-8 grid gap-5 sm:grid-cols-2">
          {RATE_STEPS.map((step, index) => (
            <li key={step.id} className="rounded-3xl border border-border bg-card p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold text-primary">
                {localized(step.title, lang)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {localized(step.body, lang)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-3xl border border-accent/40 bg-accent/5 p-8">
          <h2 className="font-heading text-lg font-semibold text-primary">{t('sur.exampleTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('sur.exampleNote')}</p>
          <dl className="mt-6 divide-y divide-border/70">
            {RATE_EXAMPLE_LINES.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-6 py-3 text-sm">
                <dt className="text-muted-foreground">{localized(line.label, lang)}</dt>
                <dd className="font-medium text-primary">{line.value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-6 py-3">
              <dt className="font-heading text-sm font-semibold text-primary">{t('common.total')}</dt>
              <dd className="font-heading text-base font-semibold text-accent">{RATE_EXAMPLE_TOTAL}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{t('sur.managedNote')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/rate-calculator">
                <Calculator className="mr-2 h-4 w-4" />
                {t('sur.ctaCalc')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/business">
                <Settings2 className="mr-2 h-4 w-4" />
                {t('sur.ctaZones')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}