import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/components/LanguageProvider';
import { Image } from '@/components/ui/image';

// Public, scrolling band of partner logos. Reads the PartnerLogo table directly:
// the entity's read rule is open, so an anonymous visitor on the home page sees
// the same logos a signed-in merchant does. Logos come from the CMS the platform
// admin maintains in the super-admin console.
export default function PartnerMarquee() {
  const { t } = useI18n();
  const [partners, setPartners] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.entities.PartnerLogo.filter({ active: true }, { sort: 'sort_order', limit: 50 })
      .then((page) => {
        if (alive) setPartners(page.items || []);
      })
      .catch(() => {
        if (alive) setPartners([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!partners) return null;
  if (!partners.length) return null;

  // Duplicate the set so the marquee loops seamlessly (translateX -50%).
  const loop = [...partners, ...partners];

  return (
    <section aria-label={t('partners.title')} className="border-y border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('partners.title')}
        </p>
      </div>
      <div className="group relative mt-6 overflow-hidden">
        {/* fade the edges so logos don't hard-cut at the viewport edge */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="zx-marquee flex w-max items-center gap-14 px-8 group-hover:[animation-play-state:paused]">
          {loop.map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.website || undefined}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-12 shrink-0 items-center"
              aria-label={partner.name}
            >
              <Image
                src={partner.logo_url}
                alt={partner.name}
                className="h-9 w-auto max-w-[150px] opacity-65 transition hover:opacity-100"
                fittingType="fit"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}