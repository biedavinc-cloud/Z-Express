import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Code2,
  Globe,
  MapPin,
  Package,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Image } from '@/components/ui/image';
import {
  EXPRESS_ICON,
  FREIGHT_ICON,
  LAST_MILE_ICON,
  SUPPLY_CHAIN_ICON,
} from '@/lib/branding';

// A detailed, Aramex-style service page: hero, overview, the four core services,
// how it works, features, benefits, industries, FAQ and a closing CTA. Service
// tiles use the branded product icons (not generic ones); steps and features use
// lucide marks only where no branded asset exists.
const SERVICES = [
  { image: EXPRESS_ICON, name: 'solutions.expressName', desc: 'solutions.expressDesc' },
  { image: FREIGHT_ICON, name: 'solutions.freightName', desc: 'solutions.freightDesc' },
  { image: SUPPLY_CHAIN_ICON, name: 'solutions.supplyName', desc: 'solutions.supplyDesc' },
  { image: LAST_MILE_ICON, name: 'solutions.lastmileName', desc: 'solutions.lastmileDesc' },
];

const STEPS = [
  { icon: ClipboardList, title: 'solutions.step1Title', desc: 'solutions.step1Desc' },
  { icon: Truck, title: 'solutions.step2Title', desc: 'solutions.step2Desc' },
  { icon: ScanLine, title: 'solutions.step3Title', desc: 'solutions.step3Desc' },
  { icon: PackageCheck, title: 'solutions.step4Title', desc: 'solutions.step4Desc' },
];

const FEATURES = [
  { icon: MapPin, key: 'solutions.feature1' },
  { icon: ShieldCheck, key: 'solutions.feature2' },
  { icon: Wallet, key: 'solutions.feature3' },
  { icon: Code2, key: 'solutions.feature4' },
  { icon: Globe, key: 'solutions.feature5' },
  { icon: Warehouse, key: 'solutions.feature6' },
];

const BENEFITS = [
  'solutions.benefit1',
  'solutions.benefit2',
  'solutions.benefit3',
  'solutions.benefit4',
];

const INDUSTRIES = [
  'solutions.industry1',
  'solutions.industry2',
  'solutions.industry3',
  'solutions.industry4',
  'solutions.industry5',
  'solutions.industry6',
];

const FAQS = [
  ['solutions.faq1q', 'solutions.faq1a'],
  ['solutions.faq2q', 'solutions.faq2a'],
  ['solutions.faq3q', 'solutions.faq3a'],
  ['solutions.faq4q', 'solutions.faq4a'],
];

export default function Solutions() {
  const { t } = useI18n();

  return (
    <SiteShell>
      {/* Hero */}
      <section className="bg-primary py-20 text-primary-foreground sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            <Package className="h-3.5 w-3.5" />
            {t('solutions.pageEyebrow')}
          </span>
          <h1 className="mt-6 max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t('solutions.pageTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
            {t('solutions.pageSubtitle')}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/register?returnTo=/portal/onboarding">
                {t('solutions.ctaButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/contact">{t('nav.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {t('solutions.overviewTitle')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t('solutions.overviewBody')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe, value: '54', label: 'network.coverage' },
              { icon: Warehouse, value: '4', label: 'solutions.pageEyebrow' },
              { icon: ScanLine, value: 'OTP', label: 'solutions.feature2' },
              { icon: BarChart3, value: 'API', label: 'solutions.feature4' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-accent" />
                  <p className="mt-3 font-heading text-2xl font-semibold text-primary">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(stat.label)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core services */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('solutions.title')}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{t('solutions.subtitle')}</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {SERVICES.map((service) => (
              <article
                key={service.name}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition hover:border-accent/50"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 transition group-hover:bg-accent/20" />
                <Image src={service.image} alt={t(service.name)} className="relative h-12 w-12 rounded-2xl" />
                <h3 className="relative mt-6 font-heading text-xl font-semibold text-primary">{t(service.name)}</h3>
                <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t(service.desc)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          {t('solutions.howTitle')}
        </h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="mt-4 grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-primary">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.desc)}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Features */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('solutions.featuresTitle')}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.key} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="pt-1.5 text-sm font-medium text-primary">{t(feature.key)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits + industries */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {t('solutions.benefitsTitle')}
            </h2>
            <ul className="mt-8 space-y-4">
              {BENEFITS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/85">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {t('solutions.industriesTitle')}
            </h2>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {INDUSTRIES.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary"
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('solutions.faqTitle')}
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map(([q, a], index) => (
              <AccordionItem key={q} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium text-primary">
                  {t(q)}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{t('solutions.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-primary-foreground/75">{t('solutions.ctaBody')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/register?returnTo=/portal/onboarding">
                {t('solutions.ctaButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/contact">{t('nav.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}