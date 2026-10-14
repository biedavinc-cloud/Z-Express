import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, PackagePlus, ShieldCheck, HandCoins, Code2 } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';

const TRUST = [
  { key: 'hero.trustPay', icon: ShieldCheck },
  { key: 'hero.trustCod', icon: HandCoins },
  { key: 'hero.trustApi', icon: Code2 },
];

export default function HeroActions() {
  const { t } = useI18n();

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/send"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-lg shadow-primary/30 transition hover:bg-accent/90"
        >
          <PackagePlus className="h-4 w-4" />
          {t('quick.sendTitle')}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/rate-calculator"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-primary-foreground/25 px-6 text-sm font-medium text-primary-foreground/90 backdrop-blur transition hover:border-accent hover:text-accent"
        >
          <Calculator className="h-4 w-4" />
          {t('quick.rateTitle')}
        </Link>
      </div>

      <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
        {TRUST.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex items-center gap-2 text-xs text-primary-foreground/70">
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
              {t(item.key)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}