import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/components/LanguageProvider';
import {
  EXPRESS_ICON,
  FREIGHT_ICON,
  LAST_MILE_ICON,
  SUPPLY_CHAIN_ICON,
} from '@/lib/branding';

const SERVICES = [
  { image: EXPRESS_ICON, name: 'solutions.expressName', desc: 'solutions.expressDesc' },
  { image: FREIGHT_ICON, name: 'solutions.freightName', desc: 'solutions.freightDesc' },
  { image: SUPPLY_CHAIN_ICON, name: 'solutions.supplyName', desc: 'solutions.supplyDesc' },
  { image: LAST_MILE_ICON, name: 'solutions.lastmileName', desc: 'solutions.lastmileDesc' },
];

export default function SolutionsSection() {
  const { t } = useI18n();

  return (
    <section id="solutions" className="bg-secondary/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('solutions.title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{t('solutions.subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.name}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition hover:border-accent/50"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 transition group-hover:bg-accent/20" />
                {service.image ? (
                  <Image
                    src={service.image}
                    alt={t(service.name)}
                    className="relative h-12 w-12 rounded-2xl"
                  />
                ) : (
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent">
                    <Icon className="h-6 w-6" />
                  </span>
                )}
                <h3 className="relative mt-6 font-heading text-xl font-semibold text-primary">{t(service.name)}</h3>
                <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t(service.desc)}
                </p>
                <Link
                  to="/contact"
                  className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition group-hover:text-accent"
                >
                  {t('solutions.learnMore')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}