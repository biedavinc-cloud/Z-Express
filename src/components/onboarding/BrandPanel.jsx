import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/components/LanguageProvider';
import BrandMark from '@/components/site/BrandMark';
import { ONBOARD_IMAGES } from '@/lib/siteImages';

const POINTS = ['onboard.brandPoint1', 'onboard.brandPoint2', 'onboard.brandPoint3'];
const GALLERY = [ONBOARD_IMAGES[1], ONBOARD_IMAGES[2]];

export default function BrandPanel() {
  const { t } = useI18n();

  return (
    <aside className="relative hidden overflow-hidden rounded-3xl bg-primary p-9 text-primary-foreground lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src={ONBOARD_IMAGES[0]}
          alt=""
          className="h-full w-full"
          style={{ opacity: 0.4 }}
          fittingType="fill"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/90 to-primary/95" />
      </div>

      <div className="relative">
        <BrandMark variant="light" size="lg" />

        <p className="mt-9 inline-flex rounded-full border border-accent/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {t('onboard.trialBadge')}
        </p>
        <h2 className="mt-5 font-heading text-3xl font-semibold leading-tight">{t('onboard.brandTitle')}</h2>

        <ul className="mt-9 space-y-4">
          {POINTS.map((key) => (
            <li key={key} className="flex items-start gap-3 text-sm leading-relaxed text-primary-foreground/90">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      {/* Bright operations photography, kept crisp inside the dark brand panel. */}
      <div className="relative mt-auto pt-10">
        <div className="grid grid-cols-2 gap-3">
          {GALLERY.map((src) => (
            <div key={src} className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-primary-foreground/20">
              <Image src={src} alt="" className="h-full w-full" fittingType="fill" />
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-primary-foreground/80">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t('onboard.secureNote')}
        </p>
      </div>
    </aside>
  );
}