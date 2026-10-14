import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { COUNTRIES, CURRENCIES, PRICING_MODELS, formatMoney } from '@/lib/logistics';
import { estimateZoneBase } from '@/lib/zoneEstimate';

// Zone editor: coverage, pricing model and the rates the quote engine reads.
export default function ZoneForm({ value, onChange, onSave, onCancel, t }) {
  const [testWeight, setTestWeight] = useState('5');
  const [testDistance, setTestDistance] = useState('20');
  const field = 'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-3xl border border-accent/40 bg-card p-6">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {value.id ? t('zones.edit') : t('zones.new')}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('zones.name')}</Label>
          <input className={field} value={value.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.country')}</Label>
          <select className={field} value={value.country} onChange={(e) => set({ country: e.target.value })}>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{t('zones.cities')}</Label>
          <input
            className={field}
            placeholder={t('zones.allCities')}
            value={value.cities}
            onChange={(e) => set({ cities: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.model')}</Label>
          <select
            className={field}
            value={value.pricing_model}
            onChange={(e) => set({ pricing_model: e.target.value })}
          >
            {PRICING_MODELS.map((model) => (
              <option key={model} value={model}>{t(`pricing.${model}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.currency')}</Label>
          <select className={field} value={value.currency} onChange={(e) => set({ currency: e.target.value })}>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.base')}</Label>
          <Input type="number" value={value.base_rate} onChange={(e) => set({ base_rate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.perKg')}</Label>
          <Input type="number" value={value.per_kg} onChange={(e) => set({ per_kg: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.perKm')}</Label>
          <Input type="number" value={value.per_km} onChange={(e) => set({ per_km: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.min')}</Label>
          <Input type="number" value={value.min_charge} onChange={(e) => set({ min_charge: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('zones.eta')}</Label>
          <Input type="number" value={value.eta_days} onChange={(e) => set({ eta_days: e.target.value })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <Label>{t('zones.remote')}</Label>
          <Switch checked={value.remote_area} onCheckedChange={(checked) => set({ remote_area: checked })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <Label>{t('zones.active')}</Label>
          <Switch checked={value.active} onCheckedChange={(checked) => set({ active: checked })} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-secondary px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('zones.estimate')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('zones.estimateHint')}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('zones.testWeight')}</Label>
            <Input
              type="number"
              className="w-32"
              value={testWeight}
              onChange={(e) => setTestWeight(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('zones.testDistance')}</Label>
            <Input
              type="number"
              className="w-32"
              value={testDistance}
              onChange={(e) => setTestDistance(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('zones.estimateResult')}</p>
            <p className="font-heading text-lg font-semibold text-primary">
              {formatMoney(estimateZoneBase(value, testWeight, testDistance), value.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button onClick={onSave} className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
          {t('zones.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="rounded-2xl">
          {t('zones.cancel')}
        </Button>
      </div>
    </div>
  );
}