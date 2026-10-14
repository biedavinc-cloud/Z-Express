import React from 'react';
import { Button } from '@/components/ui/button';
import { MARKETPLACES, MARKETPLACE_MODES } from '@/lib/marketplaces';
import { PAYMENT_MODES, SERVICE_TYPES } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function MarketplaceForm({ form, setForm, onSubmit, onCancel, busy, t }) {
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <select className={inputClass} value={form.marketplace} onChange={set('marketplace')}>
          {MARKETPLACES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder={t('mkt.label')} value={form.label} onChange={set('label')} />
        <select className={inputClass} value={form.mode} onChange={set('mode')}>
          {MARKETPLACE_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t(`mkt.mode.${mode}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <select className={inputClass} value={form.default_service_type} onChange={set('default_service_type')}>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type} className="capitalize">
              {type}
            </option>
          ))}
        </select>
        <select className={inputClass} value={form.default_payment_mode} onChange={set('default_payment_mode')}>
          {PAYMENT_MODES.map((mode) => (
            <option key={mode} value={mode} className="capitalize">
              {mode}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder={t('mkt.webhook')}
          value={form.webhook_url}
          onChange={set('webhook_url')}
        />
      </div>

      {form.mode === 'carrier_account' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <input
            className={inputClass}
            placeholder={t('mkt.apiBase')}
            value={form.api_base_url}
            onChange={set('api_base_url')}
          />
          <input className={inputClass} placeholder={t('mkt.apiKey')} value={form.api_key} onChange={set('api_key')} />
          <input
            className={inputClass}
            placeholder={t('mkt.apiSecret')}
            value={form.api_secret}
            onChange={set('api_secret')}
          />
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <Button onClick={onSubmit} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
          {t('common.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="rounded-xl">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}