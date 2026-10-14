import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Linkedin, Twitter, Facebook, Instagram, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import BrandMark from '@/components/site/BrandMark';
import { Image } from '@/components/ui/image';
import { BUSINESS_HERO_IMAGE } from '@/lib/siteImages';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  PLATFORM_EMAIL,
  PLATFORM_MAILTO,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_PHONE,
} from '@/lib/support';

// Compact, premium footer: brand and contact on the left, the four link groups as
// dropdown menus on the right, and a slim legal bar. The dropdowns keep the
// footer to a single row on desktop and collapse cleanly on phones.
const COLUMNS = [
  {
    title: 'footer.company',
    links: [
      { key: 'nav.solutions', to: '/solutions' },
      { key: 'nav.business', to: '/business' },
      { key: 'nav.developers', to: '/developers' },
      { key: 'nav.careers', to: '/careers' },
      { key: 'nav.contact', to: '/contact' },
      { key: 'help.title', to: '/support/help-center' },
    ],
  },
  {
    title: 'footer.services',
    links: [
      { key: 'solutions.expressName', to: '/solutions' },
      { key: 'solutions.freightName', to: '/solutions' },
      { key: 'solutions.supplyName', to: '/solutions' },
      { key: 'solutions.lastmileName', to: '/solutions' },
      { key: 'nav.shipTrack', to: '/track' },
    ],
  },
  {
    title: 'footer.developers',
    links: [
      { key: 'footer.apiDocs', to: '/developers' },
      { key: 'dev.webhooks', to: '/developers#webhooks' },
      { key: 'dev.marketplaceTitle', to: '/developers#marketplaces' },
      { key: 'quick.rateTitle', to: '/rate-calculator' },
    ],
  },
  {
    title: 'footer.legal',
    links: [
      { key: 'footer.sdkPolicy', to: '/legal/sdk-policy' },
      { key: 'footer.remoteSurcharge', to: '/surcharges' },
      { key: 'footer.fuelSurcharge', to: '/surcharges' },
      { key: 'footer.privacy', to: '/legal/privacy' },
      { key: 'footer.terms', to: '/legal/terms' },
    ],
  },
];

const SOCIALS = [Linkedin, Twitter, Facebook, Instagram];

export default function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand + contact */}
          <div className="max-w-sm">
            <BrandMark variant="light" />
            <p className="mt-3 text-xs leading-relaxed text-primary-foreground/60">{t('footer.aboutText')}</p>
            <div className="mt-4 space-y-1.5 text-xs text-primary-foreground/75">
              <a href={SUPPORT_MAILTO} className="flex items-center gap-2 transition hover:text-accent">
                <Mail className="h-3.5 w-3.5 shrink-0 text-accent" />
                {SUPPORT_EMAIL}
              </a>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                {SUPPORT_PHONE}
              </p>
              <a href={PLATFORM_MAILTO} className="flex items-center gap-2 transition hover:text-accent">
                <Mail className="h-3.5 w-3.5 shrink-0 text-accent" />
                {PLATFORM_EMAIL}
              </a>
            </div>
            <Image
              src={BUSINESS_HERO_IMAGE}
              alt="Z. Express"
              originWidth={2688}
              originHeight={864}
              className="mt-5 w-32 sm:w-40"
              fittingType="fit"
            />
          </div>

          {/* Navigation dropdowns */}
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map((column) => (
              <DropdownMenu key={column.title}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 px-3.5 py-2 text-xs font-medium text-primary-foreground/85 transition hover:border-accent hover:text-accent data-[state=open]:border-accent data-[state=open]:text-accent"
                  >
                    {t(column.title)}
                    <ChevronDown className="h-3.5 w-3.5 transition data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={6} align="end" className="w-52">
                  {column.links.map((link) => (
                    <DropdownMenuItem key={`${column.title}-${link.key}`} asChild>
                      <Link to={link.to}>{t(link.key)}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2 lg:pt-1">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-primary-foreground/50">
              {t('footer.follow')}
            </span>
            {SOCIALS.map((Icon, index) => (
              <Link
                key={index}
                to="/contact"
                className="grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/15 transition hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-primary-foreground/12 pt-5 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Z. Express. {t('footer.rights')} · {t('footer.builtBy')}{' '}
            <a
              href="https://liafrik.com"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent transition hover:underline"
            >
              Liafrik
            </a>
          </span>
          <div className="flex gap-4">
            <Link to="/legal/privacy" className="transition hover:text-primary-foreground">
              {t('footer.privacy')}
            </Link>
            <Link to="/legal/terms" className="transition hover:text-primary-foreground">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}