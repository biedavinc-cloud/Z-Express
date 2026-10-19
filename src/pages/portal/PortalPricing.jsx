import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scopeForEntity } from '@/lib/session';
import { PRICING_MODELS, SURCHARGE_BASES, SURCHARGE_TYPES, COUNTRIES, formatMoney } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function PortalPricing() {
  const { tenant, t, session } = useOutletContext();
  const [tab, setTab] = useState('zones');
  const [zones, setZones] = useState([]);
  const [surcharges, setSurcharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showZone, setShowZone] = useState(false);
  const [showSurcharge, setShowSurcharge] = useState(false);

  const [zone, setZone] = useState({
    name: '',
    country: 'Cameroon',
    cities: '',
    pricing_model: 'weight',
    base_rate: 0,
    per_kg: 0,
    per_km: 0,
    min_charge: 0,
    eta_days: 2,
    remote_area: false,
    currency: tenant.currency || 'USD',
  });
  const [surcharge, setSurcharge] = useState({
    name: '',
    type: 'fuel',
    mode: 'percent',
    amount: 0,
    basis: 'always',
    threshold: 0,
    zone_id: '',
    applies_to: 'all',
    active: true,
  });

  const load = async () => {
    const [z, s] = await Promise.all([
      api.entities.Zone.filter({ tenant_id: tenant.id }, { sort: 'name', limit: 100 }),
      api.entities.Surcharge.filter({ tenant_id: tenant.id }, { sort: 'name', limit: 100 }),
    ]);
    setZones(z.items || z);
    setSurcharges(s.items || s);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const addZone = async () => {
    if (!zone.name) return;
    setBusy(true);
    await api.entities.Zone.create({
      ...zone,
      cities: zone.cities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      base_rate: Number(zone.base_rate) || 0,
      per_kg: Number(zone.per_kg) || 0,
      per_km: Number(zone.per_km) || 0,
      min_charge: Number(zone.min_charge) || 0,
      eta_days: Number(zone.eta_days) || 1,
      active: true,
      ...(await scopeForEntity(tenant, 'Zone', session?.user?.email)),
    });
    setShowZone(false);
    setBusy(false);
    load();
  };

  const addSurcharge = async () => {
    if (!surcharge.name) return;
    setBusy(true);
    await api.entities.Surcharge.create({
      ...surcharge,
      amount: Number(surcharge.amount) || 0,
      threshold: Number(surcharge.threshold) || 0,
      zone_id: surcharge.basis === 'zone' ? surcharge.zone_id : '',
      ...(await scopeForEntity(tenant, 'Surcharge', session?.user?.email)),
    });
    setShowSurcharge(false);
    setBusy(false);
    load();
  };

  const toggle = async (entity, record, field) => {
    await api.entities[entity].update(record.id, { [field]: !record[field] });
    load();
  };

  const remove = async (entity, record) => {
    await api.entities[entity].delete(record.id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('portal.pricing')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('rate.subtitle')}</p>
        </div>
        <Button
          onClick={() => (tab === 'zones' ? setShowZone(true) : setShowSurcharge(true))}
          className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tab === 'zones' ? t('pricing.addZone') : t('pricing.addSurcharge')}
        </Button>
      </div>

      <div className="flex gap-2">
        {['zones', 'surcharges'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t(`pricing.${key}`)}
          </button>
        ))}
      </div>

      {showZone && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <input
              placeholder={t('pricing.zoneName')}
              className={inputClass}
              value={zone.name}
              onChange={(e) => setZone({ ...zone, name: e.target.value })}
            />
            <select className={inputClass} value={zone.country} onChange={(e) => setZone({ ...zone, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder="Douala, Yaoundé"
              className={inputClass}
              value={zone.cities}
              onChange={(e) => setZone({ ...zone, cities: e.target.value })}
            />
            <select
              className={inputClass}
              value={zone.pricing_model}
              onChange={(e) => setZone({ ...zone, pricing_model: e.target.value })}
            >
              {PRICING_MODELS.map((model) => (
                <option key={model} value={model}>
                  {t(`pricing.${model}`)}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder={t('pricing.baseRate')}
              className={inputClass}
              value={zone.base_rate}
              onChange={(e) => setZone({ ...zone, base_rate: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('pricing.perKg')}
              className={inputClass}
              value={zone.per_kg}
              onChange={(e) => setZone({ ...zone, per_kg: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('pricing.perKm')}
              className={inputClass}
              value={zone.per_km}
              onChange={(e) => setZone({ ...zone, per_km: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('pricing.minCharge')}
              className={inputClass}
              value={zone.min_charge}
              onChange={(e) => setZone({ ...zone, min_charge: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('pricing.etaDays')}
              className={inputClass}
              value={zone.eta_days}
              onChange={(e) => setZone({ ...zone, eta_days: e.target.value })}
            />
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={zone.remote_area}
                onChange={(e) => setZone({ ...zone, remote_area: e.target.checked })}
                className="h-4 w-4 accent-[#FF8E24]"
              />
              {t('pricing.remoteArea')}
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={addZone} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowZone(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {showSurcharge && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <input
              placeholder={t('pricing.surchargeName')}
              className={inputClass}
              value={surcharge.name}
              onChange={(e) => setSurcharge({ ...surcharge, name: e.target.value })}
            />
            <select
              className={inputClass}
              value={surcharge.type}
              onChange={(e) => setSurcharge({ ...surcharge, type: e.target.value })}
            >
              {SURCHARGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={surcharge.mode}
              onChange={(e) => setSurcharge({ ...surcharge, mode: e.target.value })}
            >
              <option value="percent">{t('pricing.percent')}</option>
              <option value="flat">{t('pricing.flat')}</option>
            </select>
            <input
              type="number"
              placeholder={t('common.amount')}
              className={inputClass}
              value={surcharge.amount}
              onChange={(e) => setSurcharge({ ...surcharge, amount: e.target.value })}
            />
            <select
              className={inputClass}
              value={surcharge.applies_to}
              onChange={(e) => setSurcharge({ ...surcharge, applies_to: e.target.value })}
            >
              <option value="all">{t('common.all')}</option>
              <option value="express">express</option>
              <option value="cod">COD</option>
            </select>
            <select
              className={inputClass}
              value={surcharge.basis}
              onChange={(e) => setSurcharge({ ...surcharge, basis: e.target.value, threshold: 0, zone_id: '' })}
            >
              {SURCHARGE_BASES.map((basis) => (
                <option key={basis} value={basis}>
                  {t(`pricing.basis.${basis}`)}
                </option>
              ))}
            </select>
            {(surcharge.basis === 'weight' || surcharge.basis === 'volumetric') && (
              <input
                type="number"
                placeholder={t('pricing.threshold')}
                className={inputClass}
                value={surcharge.threshold}
                onChange={(e) => setSurcharge({ ...surcharge, threshold: e.target.value })}
              />
            )}
            {surcharge.basis === 'zone' && (
              <select
                className={inputClass}
                value={surcharge.zone_id}
                onChange={(e) => setSurcharge({ ...surcharge, zone_id: e.target.value })}
              >
                <option value="">{t('pricing.zoneRule')}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">{t('pricing.basis')}: {t(`pricing.basis.${surcharge.basis}`)}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={addSurcharge} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowSurcharge(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {tab === 'zones' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.length === 0 && (
            <p className="rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t('pricing.noZones')}
            </p>
          )}
          {zones.map((z) => (
            <div key={z.id} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-semibold text-primary">{z.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {z.country}
                    {z.cities?.length ? ` · ${z.cities.join(', ')}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove('Zone', z)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                  {t(`pricing.${z.pricing_model}`)}
                </span>
                {z.remote_area && (
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">{t('pricing.remoteArea')}</span>
                )}
              </div>
              <dl className="mt-5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('pricing.baseRate')}</dt>
                  <dd className="font-medium text-primary">{formatMoney(z.base_rate, z.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('pricing.perKg')}</dt>
                  <dd className="font-medium text-primary">{formatMoney(z.per_kg, z.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('pricing.etaDays')}</dt>
                  <dd className="font-medium text-primary">{z.eta_days}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => toggle('Zone', z, 'active')}
                className={`mt-5 w-full rounded-full px-3 py-2 text-xs font-medium transition ${
                  z.active ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {z.active ? t('common.active') : t('common.inactive')}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'surcharges' && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-6 py-3 font-medium">{t('pricing.surchargeType')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.amount')}</th>
                  <th className="px-6 py-3 font-medium">{t('pricing.basis')}</th>
                  <th className="px-6 py-3 font-medium">{t('pricing.appliesTo')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {surcharges.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-sm text-muted-foreground">
                      {t('pricing.noSurcharges')}
                    </td>
                  </tr>
                )}
                {surcharges.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 font-medium text-primary">{s.name}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{s.type}</td>
                    <td className="px-6 py-4 text-sm text-primary">
                      {s.mode === 'percent' ? `${s.amount}%` : formatMoney(s.amount, tenant.currency)}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {t(`pricing.basis.${s.basis || 'always'}`)}
                      {(s.basis === 'weight' || s.basis === 'volumetric') && s.threshold
                        ? ` · > ${s.threshold} kg`
                        : ''}
                      {s.basis === 'zone' && s.zone_id
                        ? ` · ${zones.find((z) => z.id === s.zone_id)?.name || ''}`
                        : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{s.applies_to}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggle('Surcharge', s, 'active')}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {s.active ? t('common.active') : t('common.inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => remove('Surcharge', s)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}