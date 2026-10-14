import React from 'react';
import { useI18n } from '@/components/LanguageProvider';
import { COUNTRIES, CITIES } from '@/lib/logistics';
import Field, { fieldClass } from './Field';

export default function CompanyStep({ form, errors, update }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={t('onboard.companyName')} error={errors.name}>
        <input className={fieldClass} value={form.name} onChange={update('name')} autoFocus />
      </Field>
      <Field label={t('onboard.legalName')}>
        <input className={fieldClass} value={form.legal_name} onChange={update('legal_name')} />
      </Field>
      <Field label={t('onboard.country')} error={errors.country}>
        <select className={fieldClass} value={form.country} onChange={update('country')}>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label={t('onboard.city')} error={errors.city}>
        <input
          className={fieldClass}
          value={form.city}
          onChange={update('city')}
          list="zx-onboard-cities"
          autoComplete="off"
        />
      </Field>
      <Field label={t('onboard.phone')} error={errors.phone}>
        <input className={fieldClass} value={form.phone} onChange={update('phone')} placeholder="+237 6 00 00 00 00" />
      </Field>
      <Field label={t('onboard.website')}>
        <input className={fieldClass} value={form.website} onChange={update('website')} placeholder="https://" />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t('onboard.about')} hint={t('onboard.aboutHint')}>
          <textarea
            rows={3}
            className={`resize-none ${fieldClass}`}
            value={form.about}
            onChange={update('about')}
          />
        </Field>
      </div>
      <datalist id="zx-onboard-cities">
        {CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}