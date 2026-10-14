import React from 'react';
import { Code2 } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import InfoHero from '@/components/site/InfoHero';
import LegalDocument from '@/components/site/LegalDocument';
import { useI18n } from '@/components/LanguageProvider';
import { SDK_DOC } from '@/lib/legalDocs';

export default function SdkPolicy() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <InfoHero
        icon={Code2}
        badge={t('footer.sdkPolicy')}
        title={t('legal.sdk.title')}
        subtitle={t('legal.sdk.subtitle')}
      />
      <LegalDocument doc={SDK_DOC} />
    </SiteShell>
  );
}