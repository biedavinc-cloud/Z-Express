import React from 'react';
import { useI18n } from '@/components/LanguageProvider';

const STATS = [
  { key: 'hero.stats.shipments', value: '2.4M+' },
  { key: 'hero.stats.cities', value: '38' },
  { key: 'hero.stats.partners', value: '120+' },
  { key: 'hero.stats.ontime', value: '96%' },
];

export default function HeroStats() {
  const { t } = useI18n();

  return (
    <div className="mt-9 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 border-t border-primary-foreground/15 pt-7 sm:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.key}>
          <div className="font-heading text-2xl font-semibold text-accent">{stat.value}</div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-primary-foreground/55">
            {t(stat.key)}
          </div>
        </div>
      ))}
    </div>
  );
}