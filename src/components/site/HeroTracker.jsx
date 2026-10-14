import React from 'react';
import { MapPin } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import ImageBackdrop from '@/components/site/ImageBackdrop';
import HeroActions from '@/components/site/HeroActions';
import HeroStats from '@/components/site/HeroStats';
import HeroTrackBar from '@/components/site/HeroTrackBar';

export default function HeroTracker() {
  const { t } = useI18n();

  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <ImageBackdrop overlayClassName="bg-gradient-to-r from-primary via-primary/85 to-primary/40" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-primary via-primary/10 to-primary/45"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:pb-14 lg:pt-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary/30 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </span>

          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            {t('hero.title')}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80">
            {t('hero.subtitle')}
          </p>

          <HeroActions />
          <HeroStats />
        </div>

        {/* Single full-width tracking line, sitting directly above the traffic band. */}
        <HeroTrackBar />
      </div>
    </section>
  );
}