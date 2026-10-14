import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Boxes, Building2, Code2, ArrowRight } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { BUSINESS_HERO_IMAGE } from '@/lib/siteImages';
import PricingTable from '@/components/pricing/PricingTable';
import PricingCalculator from '@/components/pricing/PricingCalculator';

const PILLARS = [
  { icon: BadgeCheck, title: 'biz.p1Title', desc: 'biz.p1Desc' },
  { icon: Boxes, title: 'biz.p2Title', desc: 'biz.p2Desc' },
  { icon: Code2, title: 'biz.p3Title', desc: 'biz.p3Desc' },
];

export default function BusinessPortal() {
  const { t } = useI18n();
  const [cycle, setCycle] = useState('monthly');

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <Image
            src={BUSINESS_HERO_IMAGE}
            alt="Z. Express — express, freight, warehousing and last-mile logistics"
            className="h-full w-full"
            fittingType="fill"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-xl rounded-3xl bg-primary/90 p-8 ring-1 ring-primary-foreground/15 backdrop-blur-sm sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
              <Building2 className="h-3.5 w-3.5" />
              {t('biz.title')}
            </span>
            <h1 className="mt-6 font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {t('biz.subtitle')}
            </h1>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/register?returnTo=/portal/onboarding">
                  {t('biz.ctaCreate')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/login?returnTo=/portal">{t('biz.ctaLogin')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="rounded-3xl border border-border bg-card p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 font-heading text-lg font-semibold text-primary">{t(pillar.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(pillar.desc)}</p>
              </article>
            );
          })}
        </div>

        <h2 className="mt-20 font-heading text-3xl font-semibold tracking-tight text-primary">
          {t('biz.plans')}
        </h2>
        <PricingTable
          className="mt-10"
          cycle={cycle}
          onCycleChange={setCycle}
          ctaTo={(plan) => `/register?returnTo=/portal/onboarding&plan=${plan.id}`}
        />

        <PricingCalculator className="mt-8" />

        <p className="mt-6 text-xs text-muted-foreground">{t('sub.model')}</p>
      </section>
    </SiteShell>
  );
}