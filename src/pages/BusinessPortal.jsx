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
      {/* Transparent hero: the PNG wordmark carries its own alpha, so the page
          background shows through the negative space — no dark fill behind it. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative aspect-[3.11/1] w-full">
            <Image
              src={BUSINESS_HERO_IMAGE}
              alt="Z. Express — express, freight, warehousing and last-mile logistics"
              className="h-full w-full"
              fittingType="fit"
            />
          </div>
          <div className="px-1 pb-12 pt-4 sm:px-2 sm:pb-16 sm:pt-6">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
                <Building2 className="h-3.5 w-3.5" />
                {t('biz.title')}
              </span>
              <h1 className="mt-4 font-heading text-xl font-semibold leading-snug tracking-tight text-primary sm:text-3xl">
                {t('biz.subtitle')}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3">
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
                  className="rounded-2xl border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Link to="/login?returnTo=/portal">{t('biz.ctaLogin')}</Link>
                </Button>
              </div>
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