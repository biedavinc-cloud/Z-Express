import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { localized, localizedList } from '@/lib/localized';
import { SUPPORT_EMAIL } from '@/lib/support';

// Renders one policy document: its version date, the numbered sections, and the
// support card that closes every legal page.
export default function LegalDocument({ doc }) {
  const { t, lang } = useI18n();

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5 text-accent" />
        {t('legal.updatedOn', { date: localized(doc.updated, lang) })}
      </div>

      <div className="mt-10 max-w-3xl space-y-9">
        {doc.sections.map((section, index) => (
          <article key={section.id} id={section.id}>
            <h2 className="font-heading text-lg font-semibold text-primary sm:text-xl">
              <span className="mr-2 text-accent">{index + 1}.</span>
              {localized(section.heading, lang)}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {localizedList(section.paragraphs, lang).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 max-w-3xl rounded-3xl border border-accent/40 bg-accent/5 p-7">
        <h2 className="font-heading text-lg font-semibold text-primary">{t('legal.contactTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('legal.contactBody')}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/contact">{t('legal.contactCta')}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Mail className="mr-2 h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}