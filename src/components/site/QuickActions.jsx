import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ProductIcon from '@/components/site/ProductIcon';
import { useI18n } from '@/components/LanguageProvider';
import {
  BUSINESS_ICON,
  HELP_CENTER_ICON,
  RATE_CALC_ICON,
  SEND_SHIPMENT_ICON,
} from '@/lib/branding';

const CARDS = [
  { image: SEND_SHIPMENT_ICON, title: 'quick.sendTitle', desc: 'quick.sendDesc', to: '/send', primary: true },
  { image: RATE_CALC_ICON, title: 'quick.rateTitle', desc: 'quick.rateDesc', to: '/rate-calculator' },
  { image: BUSINESS_ICON, title: 'quick.bizTitle', desc: 'quick.bizDesc', to: '/business' },
  { image: HELP_CENTER_ICON, title: 'quick.supportTitle', desc: 'quick.supportDesc', to: '/contact' },
];

export default function QuickActions() {
  const { t } = useI18n();

  return (
    <section id="quick" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          {t('quick.title')}
        </h2>
        <p className="mt-3 text-base text-muted-foreground">{t('quick.subtitle')}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const primary = Boolean(card.primary);
          const className = primary
            ? 'group flex h-full flex-col rounded-3xl bg-accent p-7 text-accent-foreground transition hover:-translate-y-1 hover:zx-shadow'
            : 'group flex h-full flex-col rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/50 hover:zx-shadow';
          const inner = (
            <>
              {card.image ? (
                <ProductIcon src={card.image} alt={t(card.title)} className="h-12 w-12 rounded-2xl" onAccent={Boolean(card.primary)} />
              ) : (
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl transition ${
                    primary
                      ? 'bg-background text-accent'
                      : 'bg-primary text-primary-foreground group-hover:bg-accent'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              )}
              <h3
                className={`mt-6 font-heading text-lg font-semibold ${
                  primary ? 'text-accent-foreground' : 'text-primary'
                }`}
              >
                {t(card.title)}
              </h3>
              <p
                className={`mt-2 flex-1 text-sm leading-relaxed ${
                  primary ? 'text-accent-foreground/85' : 'text-muted-foreground'
                }`}
              >
                {t(card.desc)}
              </p>
              <span
                className={`mt-6 inline-flex items-center gap-1.5 text-sm font-medium ${
                  primary ? 'text-accent-foreground' : 'text-accent'
                }`}
              >
                {t('quick.open')}
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </>
          );
          const isAnchor = card.to.startsWith('/#');
          return isAnchor ? (
            <a key={card.title} href={card.to} className={className}>
              {inner}
            </a>
          ) : (
            <Link key={card.title} to={card.to} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}