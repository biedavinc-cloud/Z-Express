import React from 'react';
import { Lock } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import InfoHero from '@/components/site/InfoHero';
import LegalDocument from '@/components/site/LegalDocument';
import { useI18n } from '@/components/LanguageProvider';
import { PRIVACY_DOC } from '@/lib/legalDocs';

export default function PrivacyPolicy() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <InfoHero
        icon={Lock}
        badge={t('footer.privacy')}
        title={t('legal.privacy.title')}
        subtitle={t('legal.privacy.subtitle')}
      />
      <LegalDocument doc={PRIVACY_DOC} />
    </SiteShell>
  );
}