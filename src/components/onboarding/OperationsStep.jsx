import React from 'react';
import { useI18n } from '@/components/LanguageProvider';
import { CURRENCIES } from '@/lib/logistics';
import Field, { fieldClass } from './Field';

function ColourField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
      <input
        type="color"
        value={value}
        onChange={onChange}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-input bg-card"
        aria-label={label}
      />
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 block font-mono text-xs uppercase text-primary">{value}</span>
      </span>
    </label>
  );
}

export default function OperationsStep({ form, errors, update }) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <Field label={t('onboard.address')}>
        <input className={fieldClass} value={form.address} onChange={update('address')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('onboard.trackingPrefix')} hint={t('onboard.trackingPrefixHint')} error={errors.tracking_prefix}>
          <input
            maxLength={3}
            className={`${fieldClass} font-mono uppercase tracking-widest`}
            value={form.tracking_prefix}
            onChange={update('tracking_prefix')}
          />
        </Field>
        <Field label={t('onboard.currency')} hint={t('onboard.currencyHint')}>
          <select className={fieldClass} value={form.currency} onChange={update('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{t('onboard.branding')}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{t('onboard.brandingHint')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ColourField label={t('onboard.brandColor')} value={form.brand_color} onChange={update('brand_color')} />
          <ColourField label={t('onboard.accentColor')} value={form.accent_color} onChange={update('accent_color')} />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <div
            className="flex items-center justify-between px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: form.brand_color, color: '#FFFFFF' }}
          >
            {form.name || t('onboard.companyName')}
            <span
              className="rounded-lg px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: form.accent_color, color: '#FFFFFF' }}
            >
              {t('onboard.previewButton')}
            </span>
          </div>
          <p className="bg-card px-4 py-3 text-[11px] text-muted-foreground">{t('onboard.brandingPreview')}</p>
        </div>
      </div>
    </div>
  );
}