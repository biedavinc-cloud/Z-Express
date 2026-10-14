import React from 'react';
import { FileText } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import InfoHero from '@/components/site/InfoHero';
import LegalDocument from '@/components/site/LegalDocument';
import { useI18n } from '@/components/LanguageProvider';
import { TERMS_DOC } from '@/lib/legalDocs';

export default function TermsOfUse() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <InfoHero
        icon={FileText}
        badge={t('footer.terms')}
        title={t('legal.terms.title')}
        subtitle={t('legal.terms.subtitle')}
      />
      <LegalDocument doc={TERMS_DOC} />
    </SiteShell>
  );
}