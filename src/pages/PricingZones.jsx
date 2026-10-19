import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Pencil, Trash2, MapPin } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import StaffPage from '@/components/portal/StaffPage';
import ZoneForm from '@/components/pricing/ZoneForm';
import useStaffScope from '@/hooks/useStaffScope';
import { scopeForEntity } from '@/lib/session';
import { formatMoney } from '@/lib/logistics';

const BLANK = {
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
  currency: 'XAF',
  active: true,
};

export default function PricingZones() {
  const { t } = useI18n();
  const scope = useStaffScope();
  const tenant = scope?.tenant || null;
  const [zones, setZones] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async (tenantId) => {
    const page = await api.entities.Zone.filter({ tenant_id: tenantId }, { sort: 'name', limit: 100 });
    setZones(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (tenant?.id) load(tenant.id);
  }, [tenant?.id]);

  const save = async () => {
    if (!draft?.name) return;
    setBusy(true);
    const payload = {
      ...draft,
      cities: String(draft.cities || '')
        .split(',')
        .map((city) => city.trim())
        .filter(Boolean),
      base_rate: Number(draft.base_rate) || 0,
      per_kg: Number(draft.per_kg) || 0,
      per_km: Number(draft.per_km) || 0,
      min_charge: Number(draft.min_charge) || 0,
      eta_days: Number(draft.eta_days) || 1,
    };
    if (draft.id) {
      await api.entities.Zone.update(draft.id, payload);
    } else {
      await api.entities.Zone.create({
        ...payload,
        ...(await scopeForEntity(tenant, 'Zone', scope?.user?.email)),
      });
    }
    setBusy(false);
    setDraft(null);
    load(tenant.id);
  };

  const toggle = async (zone) => {
    await api.entities.Zone.update(zone.id, { active: !zone.active });
    load(tenant.id);
  };

  const remove = async (zone) => {
    await api.entities.Zone.delete(zone.id);
    load(tenant.id);
  };

  return (
    <StaffPage title={t('zones.title')} subtitle={t('zones.subtitle')}>
      <div className="space-y-6">
        {!draft && (
          <Button
            onClick={() => setDraft({ ...BLANK })}
            className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('zones.new')}
          </Button>
        )}

        {draft && (
          <ZoneForm
            value={draft}
            onChange={setDraft}
            onSave={save}
            onCancel={() => setDraft(null)}
            t={t}
            disabled={busy}
          />
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : zones.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <MapPin className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{t('zones.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-primary">{zone.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {zone.country}
                      {zone.cities?.length ? ` · ${zone.cities.join(', ')}` : ` · ${t('zones.allCities')}`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      zone.active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t(`pricing.${zone.pricing_model}`)}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('zones.base')}</dt>
                    <dd className="font-medium text-primary">{formatMoney(zone.base_rate, zone.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('zones.perKg')}</dt>
                    <dd className="font-medium text-primary">{formatMoney(zone.per_kg, zone.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('zones.perKm')}</dt>
                    <dd className="font-medium text-primary">{formatMoney(zone.per_km, zone.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('zones.eta')}</dt>
                    <dd className="font-medium text-primary">{zone.eta_days}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() =>
                      setDraft({ ...zone, cities: (zone.cities || []).join(', ') })
                    }
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {t('zones.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => toggle(zone)}>
                    {zone.active ? t('perm.suspend') : t('perm.activate')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-xl text-destructive"
                    onClick={() => remove(zone)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffPage>
  );
}