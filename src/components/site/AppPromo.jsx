import React from 'react';
import { Smartphone, Signature, Check } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Image } from '@/components/ui/image';
import StoreButton from '@/components/site/StoreButton';

const IMG = '/images';

const APP_MOCKUP = `${IMG}/fc3c48c0a_generated_fc34e5e0.png`;

const FEATURES = ['app.f1', 'app.f2', 'app.f3'];

const STORES = [
  {
    key: 'app.google',
    label: 'Google Play',
    eyebrow: 'Get it on',
    logo: `${IMG}/59d41e04d_Google-play-nuevo-aspecto-01.jpg`,
  },
  {
    key: 'app.apple',
    label: 'App Store',
    eyebrow: 'Download on the',
    logo: `${IMG}/751d6dd20_AppStoreLogo-DownloadFreeVectorPNG.png`,
  },
  {
    key: 'app.huawei',
    label: 'AppGallery',
    eyebrow: 'Explore it on',
    logo: `${IMG}/e3fc29be1_appgallery-2x.png`,
    focalX: 0.15,
    focalY: 0.5,
  },
];

export default function AppPromo() {
  const { t } = useI18n();

  return (
    <section id="app" className="relative z-10 bg-primary py-14 text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl lg:left-[76%]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            <Smartphone className="h-3.5 w-3.5" />
            Z. Express Mobile
          </span>
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{t('app.title')}</h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-primary-foreground/75">{t('app.subtitle')}</p>

          <ul className="mt-6 space-y-3">
            {FEATURES.map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm text-primary-foreground/85">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {STORES.map((store) => (
              <StoreButton
                key={store.key}
                logoSrc={store.logo}
                eyebrow={store.eyebrow}
                label={store.label}
                focalX={store.focalX}
                focalY={store.focalY}
              />
            ))}
          </div>
        </div>

        <div className="relative flex h-[420px] items-center justify-center sm:h-[520px] lg:h-[400px]">
          <div className="relative z-10 w-[236px] sm:w-[292px] lg:w-[382px]">
            <Image
              src={APP_MOCKUP}
              alt="Z. Express driver app showing live map tracking and proof of delivery"
              className="h-[420px] w-full sm:h-[520px] lg:h-[680px]"
              fittingType="fill"
            />
          </div>
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-primary-foreground/20 bg-primary/70 px-3.5 py-2 backdrop-blur">
            <Signature className="h-4 w-4 text-accent" />
            <span className="text-xs leading-snug text-primary-foreground/85">OTP · Signature · Photo POD</span>
          </div>
        </div>
      </div>
    </section>
  );
}