import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import BrandMark from '@/components/site/BrandMark';
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_PHONE } from '@/lib/support';

const COLUMNS = [
  {
    title: 'footer.company',
    links: [
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
      { key: 'solutions.expressName', to: '/#solutions' },
      { key: 'solutions.freightName', to: '/#solutions' },
      { key: 'solutions.supplyName', to: '/#solutions' },
      { key: 'solutions.lastmileName', to: '/#solutions' },
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
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2.8fr]">
          <div>
            <BrandMark variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/65">
              {t('footer.aboutText')}
            </p>
            <div className="mt-5 space-y-2 text-sm text-primary-foreground/75">
              <a
                href={SUPPORT_MAILTO}
                className="flex items-center gap-2.5 transition hover:text-accent"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-accent" />
                {SUPPORT_EMAIL}
              </a>
              <p className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                {SUPPORT_PHONE}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="mr-2 text-xs uppercase tracking-wider text-primary-foreground/50">
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

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-accent">
                  {t(column.title)}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.key}`}>
                      {link.to.startsWith('/#') ? (
                        <a
                          href={link.to}
                          className="text-sm text-primary-foreground/70 transition hover:text-primary-foreground"
                        >
                          {t(link.key)}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="text-sm text-primary-foreground/70 transition hover:text-primary-foreground"
                        >
                          {t(link.key)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-primary-foreground/12 pt-6 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Z. Express. {t('footer.rights')}{' '}
            <span className="text-primary-foreground/30">·</span> {t('footer.builtBy')}{' '}
            <a
              href="https://liafrik.com"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent transition hover:underline"
            >
              Liafrik
            </a>
          </span>
          <div className="flex gap-5">
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