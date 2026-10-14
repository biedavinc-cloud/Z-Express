import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Route, Target, TrendingUp } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import InfoHero from '@/components/site/InfoHero';
import RoleCard from '@/components/careers/RoleCard';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { CAREER_ROLES, CAREER_VALUES } from '@/lib/careers';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';
import { localized } from '@/lib/localized';

const VALUE_ICONS = { route: Route, target: Target, trending: TrendingUp, heart: Heart };

export default function Careers() {
  const { t, lang } = useI18n();

  const apply = (role) => {
    window.location.href = supportMailto(`Application — ${role}`);
  };

  return (
    <SiteShell>
      <InfoHero
        icon={Briefcase}
        badge={t('careers.badge')}
        title={t('careers.title')}
        subtitle={t('careers.subtitle')}
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-primary">
          {t('careers.valuesTitle')}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {CAREER_VALUES.map((value) => {
            const Icon = VALUE_ICONS[value.icon] || Target;
            return (
              <article key={value.id} className="rounded-3xl border border-border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/12 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-heading text-base font-semibold text-primary">
                  {localized(value.title, lang)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {localized(value.body, lang)}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-16">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-primary">
            {t('careers.rolesTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('careers.rolesSubtitle')}
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {CAREER_ROLES.map((role) => (
              <RoleCard key={role.id} role={role} onApply={apply} />
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 rounded-3xl border border-accent/40 bg-accent/5 p-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="font-heading text-lg font-semibold text-primary">{t('careers.howTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('careers.howBody', { email: SUPPORT_EMAIL })}
            </p>
            <p className="mt-5 text-sm font-semibold text-primary">{t('careers.noFitTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('careers.noFitBody')}</p>
          </div>
          <div className="flex flex-col gap-3 lg:justify-center">
            <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
              <a href={supportMailto('Application — Z. Express')}>{t('careers.apply')}</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/contact">{t('nav.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}