import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, Palette, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { CURRENCIES, COUNTRIES } from '@/lib/logistics';
import MerchantDocuments from '@/components/portal/MerchantDocuments';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const FIELDS = {
  name: 'text',
  legal_name: 'text',
  email: 'email',
  phone: 'text',
  website: 'text',
  tracking_prefix: 'text',
  country: 'select',
  city: 'text',
  address: 'text',
  brand_color: 'color',
  accent_color: 'color',
  currency: 'currency',
  about: 'textarea',
};

export default function PortalSettings() {
  const { tenant, t } = useOutletContext();
  const [form, setForm] = useState(tenant);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(tenant);
  }, [tenant]);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    setForm((prev) => ({ ...prev, logo_url: file_url }));
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    const payload = Object.keys(FIELDS).reduce((acc, field) => ({ ...acc, [field]: form[field] ?? '' }), {});
    await base44.entities.Tenant.update(tenant.id, { ...payload, logo_url: form.logo_url || '' });
    setBusy(false);
    setSaved(true);
    setTimeout(() => window.location.reload(), 900);
  };

  const field = (name, placeholder) => {
    const type = FIELDS[name];
    if (type === 'select') {
      return (
        <select className={inputClass} value={form[name] || ''} onChange={set(name)}>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      );
    }
    if (type === 'currency') {
      return (
        <select className={inputClass} value={form[name] || ''} onChange={set(name)}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      );
    }
    if (type === 'textarea') {
      return (
        <textarea
          rows={3}
          className={`${inputClass} sm:col-span-3`}
          placeholder={placeholder}
          value={form[name] || ''}
          onChange={set(name)}
        />
      );
    }
    if (type === 'color') {
      return (
        <span className="flex items-center gap-3 rounded-xl border border-input bg-card px-3.5 py-2">
          <input
            type="color"
            value={form[name] || '#3D1E00'}
            onChange={set(name)}
            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <span className="font-mono text-xs text-muted-foreground">{form[name] || ''}</span>
        </span>
      );
    }
    return (
      <input type={type} className={inputClass} placeholder={placeholder} value={form[name] || ''} onChange={set(name)} />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('settings.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <Button onClick={save} disabled={busy} className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('common.save')}
        </Button>
      </div>

      {saved && (
        <p className="rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-medium text-emerald-800">{t('settings.saved')}</p>
      )}

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {t('settings.company')}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {field('name', t('common.name'))}
          {field('legal_name', t('settings.legalName'))}
          {field('website', 'https://')}
          {field('country', t('common.country'))}
          {field('city', t('common.city'))}
          {field('address', t('common.address'))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.contacts')}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {field('email', t('team.email'))}
          {field('phone', t('common.phone'))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Palette className="h-4 w-4" />
          {t('settings.branding')}
        </h2>
        <div className="mt-5 grid items-center gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-background p-1 ring-1 ring-border">
              {form.logo_url ? (
                <Image src={form.logo_url} alt={form.name} className="h-full w-full" fittingType="fit" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <label className="cursor-pointer rounded-xl border border-input px-3.5 py-2 text-xs font-medium text-primary transition hover:border-accent">
              <Upload className="mr-1.5 inline h-3.5 w-3.5" />
              {t('settings.logo')}
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            </label>
          </div>
          {field('brand_color', t('settings.brandColor'))}
          {field('accent_color', t('settings.accentColor'))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t('settings.logoHint')}</p>
      </div>

      <MerchantDocuments tenant={tenant} />

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.prefs')}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {field('tracking_prefix', t('settings.trackingPrefix'))}
          {field('currency', t('settings.currency'))}
          {field('about', t('settings.about'))}
        </div>
      </div>
    </div>
  );
}