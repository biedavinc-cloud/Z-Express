import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Globe,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Search,
  Calculator,
  Send,
  Truck,
  Building2,
  Code2,
  LifeBuoy,
} from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import BrandMark from '@/components/site/BrandMark';
import NavGroup from '@/components/site/NavGroup';
import { COUNTRIES } from '@/lib/logistics';
import { Button } from '@/components/ui/button';
import { useCountry } from '@/components/site/useCountry';

const NAV_GROUPS = [
  {
    key: 'nav.groupShipping',
    items: [
      { key: 'nav.shipTrack', to: '/track', icon: Search },
      { key: 'quick.rateTitle', to: '/rate-calculator', icon: Calculator },
      { key: 'quick.sendTitle', to: '/send', icon: Send },
    ],
  },
  {
    key: 'nav.groupBusiness',
    items: [
      { key: 'nav.solutions', to: '/#solutions', icon: Truck },
      { key: 'nav.business', to: '/business', icon: Building2 },
      { key: 'nav.developers', to: '/developers', icon: Code2 },
      { key: 'nav.contact', to: '/contact', icon: LifeBuoy },
    ],
  },
];

export default function SiteHeader() {
  const { t, lang, setLang, languages } = useI18n();
  const { country, setCountry } = useCountry();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // On phones the sheet closes itself as soon as the visitor lands on another page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const scrollToHash = (to) => {
    setOpen(false);
    if (!to.startsWith('/#')) return;
    const id = to.slice(2);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const groups = NAV_GROUPS.map((group) => ({
    key: group.key,
    label: t(group.key),
    items: group.items.map((item) => ({ ...item, label: t(item.key) })),
  }));

  return (
    <header className="zx-safe-top sticky top-0 z-50">
      <div className="border-b border-primary-foreground/10 bg-primary text-primary-foreground">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 text-xs sm:px-6">
          <label className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span className="sr-only">{t('nav.country')}</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="cursor-pointer rounded-full border border-primary-foreground/20 bg-transparent py-0.5 pl-2.5 pr-1.5 text-xs text-primary-foreground outline-none transition hover:border-accent/60 focus:border-accent"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="text-foreground">
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-accent" />
            <div className="flex items-center gap-0.5 rounded-full border border-primary-foreground/20 p-0.5">
              {languages.map(({ code }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-full px-2.5 py-0.5 font-medium uppercase tracking-wide transition ${
                    lang === code
                      ? 'bg-accent text-accent-foreground'
                      : 'text-primary-foreground/70 hover:text-primary-foreground'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:gap-6 sm:px-6">
          <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {groups.map((group) => (
              <NavGroup key={group.key} label={group.label} items={group.items} onNavigate={scrollToHash} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" className="h-10 rounded-full px-4 text-primary hover:bg-secondary">
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
            <Button asChild className="h-10 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90">
              <Link to="/register">{t('nav.register')}</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-primary transition hover:bg-secondary lg:hidden"
            aria-label={t('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="max-h-[calc(100vh-5.5rem)] animate-in overflow-y-auto border-t border-border bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 fade-in slide-in-from-top-1 zx-scrollbar-none lg:hidden">
            {groups.map((group) => (
              <div key={group.key} className="mb-5 last:mb-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <nav className="mt-2 flex flex-col">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        to={item.to.startsWith('/#') ? '/' : item.to}
                        onClick={() => scrollToHash(item.to)}
                        className="flex items-center gap-3 border-b border-border/70 py-3.5 text-sm font-medium text-foreground/85 last:border-0"
                      >
                        <Icon className="h-4 w-4 text-accent" />
                        {item.label}
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
            <div className="mt-5 flex gap-2">
              <Button asChild variant="outline" className="h-11 flex-1 rounded-full">
                <Link to="/login" onClick={() => setOpen(false)}>
                  {t('nav.login')}
                </Link>
              </Button>
              <Button asChild className="h-11 flex-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/register" onClick={() => setOpen(false)}>
                  {t('nav.register')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}