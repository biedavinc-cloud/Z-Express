import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, Plus, ScanLine, PackageCheck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scopeFor, scopeForEntity } from '@/lib/session';
import { BRAND_NAME } from '@/lib/branding';
import { HUB_TYPES, COUNTRIES, formatDate } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const HUB_TYPE_KEY = { sorting_center: 'sorting', pickup_point: 'pickup' };

export default function PortalHubs() {
  const { tenant, t, session } = useOutletContext();
  const [hubs, setHubs] = useState([]);
  const [scans, setScans] = useState([]);
  const [load, setLoad] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showHub, setShowHub] = useState(false);
  const [tracking, setTracking] = useState('');
  const [activeHub, setActiveHub] = useState('');
  const [hub, setHub] = useState(emptyHub(tenant));

  function emptyHub(record) {
    return {
      name: '',
      code: '',
      zone_code: '',
      type: 'hub',
      country: record?.country || 'Cameroon',
      city: record?.city || '',
      address: '',
      phone: '',
      capacity_pieces: 0,
      capacity_kg: 0,
    };
  }

  const loadData = async () => {
    const [facilities, events, inFacility] = await Promise.all([
      api.entities.Hub.filter({ tenant_id: tenant.id }, { sort: 'name', limit: 100 }),
      api.entities.ShipmentEvent.filter(
        { tenant_id: tenant.id, event_type: { $in: ['scan_in', 'scan_out'] } },
        { sort: '-occurred_at', limit: 12 }
      ),
      api.entities.Shipment.aggregate({
        query: { tenant_id: tenant.id, status: { $in: ['at_hub', 'out_for_delivery'] } },
        groupBy: 'current_hub_id',
      }),
    ]);
    const list = facilities.items || facilities;
    setHubs(list);
    setScans(events.items || events);
    setLoad(
      Object.fromEntries(
        (inFacility?.rows || []).filter((row) => row.current_hub_id).map((row) => [row.current_hub_id, row.count || 0])
      )
    );
    setActiveHub((prev) => prev || list[0]?.id || '');
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const addHub = async () => {
    if (!hub.name) return;
    setBusy(true);
    await api.entities.Hub.create({
      ...hub,
      capacity_pieces: Number(hub.capacity_pieces) || 0,
      capacity_kg: Number(hub.capacity_kg) || 0,
      status: 'active',
      ...(await scopeForEntity(tenant, 'Hub', session?.user?.email)),
    });
    setHub(emptyHub(tenant));
    setShowHub(false);
    setBusy(false);
    loadData();
  };

  const toggleHub = async (facility) => {
    await api.entities.Hub.update(facility.id, {
      status: facility.status === 'active' ? 'inactive' : 'active',
    });
    loadData();
  };

  const recordScan = async (eventType) => {
    setError('');
    setMessage('');
    const code = tracking.trim().toUpperCase();
    if (!code) return;
    const facility = hubs.find((h) => h.id === activeHub);
    if (!facility) {
      setError(t('hubs.noFacilities'));
      return;
    }
    setBusy(true);
    const found = await api.entities.Shipment.filter({ tenant_id: tenant.id, tracking_number: code });
    const shipment = found.items?.[0] || found[0];
    if (!shipment) {
      setBusy(false);
      setError(t('track.empty'));
      return;
    }
    const status = eventType === 'scan_in' ? 'at_hub' : 'in_transit';
    await api.entities.Shipment.update(shipment.id, {
      current_hub_id: facility.id,
      status: shipment.status === 'delivered' ? shipment.status : status,
    });
    await api.entities.ShipmentEvent.create({
      tenant_id: tenant.id,
      shipment_id: shipment.id,
      tracking_number: shipment.tracking_number,
      status,
      event_type: eventType,
      location: `${facility.city}, ${facility.country}`,
      hub_id: facility.id,
      hub_name: facility.name,
      note: eventType === 'scan_in' ? `${t('hubs.scanIn')} · ${facility.name}` : `${t('hubs.scanOut')} · ${facility.name}`,
      occurred_at: new Date().toISOString(),
      visible_public: true,
      member_emails: shipment.member_emails?.length
        ? shipment.member_emails
        : scopeFor(tenant, session?.user?.email).member_emails,
    });
    setMessage(`${t('hubs.scanned')} · ${shipment.tracking_number}`);
    setTracking('');
    setBusy(false);
    loadData();
  };

  const printWaybill = (scan) => {
    const win = window.open('', '_blank', 'width=460,height=600');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${scan.tracking_number}</title>
      <style>*{font-family:Arial,sans-serif;color:#3D1E00}body{padding:26px}
      .card{border:2px solid #3D1E00;border-radius:14px;padding:20px}
      .tn{font-size:22px;font-weight:700;letter-spacing:2px;margin:12px 0}
      .bars{margin-top:16px;height:56px;background:repeating-linear-gradient(90deg,#3D1E00 0 2px,transparent 2px 4px,#3D1E00 4px 5px,transparent 5px 9px)}</style>
      </head><body><div class="card">
      <b>${BRAND_NAME}</b> · ${scan.hub_name || ''}
      <div class="tn">${scan.tracking_number}</div>
      <div>${scan.note || ''}</div>
      <div class="bars"></div>
      </div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
    win.document.close();
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('hubs.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('hubs.scanIn')} · {t('hubs.scanOut')} · {t('hubs.waybill')}
          </p>
        </div>
        <Button
          onClick={() => setShowHub(true)}
          className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('hubs.add')}
        </Button>
      </div>

      {showHub && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              placeholder={t('common.name')}
              className={inputClass}
              value={hub.name}
              onChange={(e) => setHub({ ...hub, name: e.target.value })}
            />
            <input
              placeholder={t('hubs.code')}
              className={inputClass}
              value={hub.code}
              onChange={(e) => setHub({ ...hub, code: e.target.value })}
            />
            <input
              placeholder={t('hubs.zoneCode')}
              className={inputClass}
              value={hub.zone_code}
              onChange={(e) => setHub({ ...hub, zone_code: e.target.value })}
            />
            <select className={inputClass} value={hub.type} onChange={(e) => setHub({ ...hub, type: e.target.value })}>
              {HUB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`hubs.${HUB_TYPE_KEY[type] || type}`)}
                </option>
              ))}
            </select>
            <select className={inputClass} value={hub.country} onChange={(e) => setHub({ ...hub, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder={t('common.city')}
              className={inputClass}
              value={hub.city}
              onChange={(e) => setHub({ ...hub, city: e.target.value })}
            />
            <input
              placeholder={t('common.address')}
              className={inputClass}
              value={hub.address}
              onChange={(e) => setHub({ ...hub, address: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('hubs.capacityPieces')}
              className={inputClass}
              value={hub.capacity_pieces}
              onChange={(e) => setHub({ ...hub, capacity_pieces: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('hubs.capacityKg')}
              className={inputClass}
              value={hub.capacity_kg}
              onChange={(e) => setHub({ ...hub, capacity_kg: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={addHub} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowHub(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ScanLine className="h-4 w-4" />
            {t('hubs.scanTitle')}
          </h2>

          {hubs.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">{t('hubs.noFacilities')}</p>
          ) : (
            <>
              <select
                value={activeHub}
                onChange={(event) => setActiveHub(event.target.value)}
                className={`mt-4 ${inputClass}`}
              >
                {hubs.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} · {facility.city}
                  </option>
                ))}
              </select>

              <input
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
                placeholder={t('hubs.scanPlaceholder')}
                className={`mt-3 font-mono ${inputClass}`}
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  disabled={busy}
                  onClick={() => recordScan('scan_in')}
                  className="rounded-xl bg-primary text-primary-foreground"
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  {t('hubs.scanIn')}
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => recordScan('scan_out')}
                  className="rounded-xl"
                >
                  {t('hubs.scanOut')}
                </Button>
              </div>

              {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('hubs.recentScans')}
          </h2>
          <div className="mt-4 divide-y divide-border">
            {scans.length === 0 && <p className="py-6 text-sm text-muted-foreground">{t('common.noData')}</p>}
            {scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-medium text-primary">{scan.tracking_number}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t(`event.${scan.event_type}`)} · {scan.hub_name || scan.location} · {formatDate(scan.occurred_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => printWaybill(scan)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hubs.map((facility) => (
          <div key={facility.id} className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <PackageCheck className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                {t(`hubs.${HUB_TYPE_KEY[facility.type] || facility.type}`)}
              </span>
            </div>
            <p className="mt-5 font-heading text-lg font-semibold text-primary">{facility.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {facility.code ? `${facility.code} · ` : ''}
              {[facility.city, facility.country].filter(Boolean).join(', ')}
            </p>
            {facility.zone_code && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('hubs.zoneCode')}: <span className="font-mono text-primary">{facility.zone_code}</span>
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {t('hubs.capacity')}: {facility.capacity_pieces || 0} · {facility.capacity_kg || 0} kg
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('hubs.load')}: {load[facility.id] || 0}
            </p>
            <button
              type="button"
              onClick={() => toggleHub(facility)}
              className={`mt-5 w-full rounded-full px-3 py-2 text-xs font-medium transition ${
                facility.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {facility.status === 'active' ? t('common.active') : t('common.inactive')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}