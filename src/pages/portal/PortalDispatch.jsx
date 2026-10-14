import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Zap, MapPin, Route as RouteIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haversineKm } from '@/lib/logistics';

export default function PortalDispatch() {
  const { tenant, t, session } = useOutletContext();
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [page, team] = await Promise.all([
      base44.entities.Shipment.filter(
        { tenant_id: tenant.id, status: { $in: ['created', 'picked_up', 'in_transit'] } },
        { sort: 'created_date', limit: 60 }
      ),
      base44.entities.TeamMember.filter({ tenant_id: tenant.id, role: 'driver' }),
    ]);
    setShipments(page.items || []);
    setDrivers(team);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const pending = useMemo(() => shipments.filter((s) => !s.assigned_driver_email), [shipments]);
  const onRoad = useMemo(() => shipments.filter((s) => s.assigned_driver_email), [shipments]);
  const available = useMemo(() => drivers.filter((d) => d.availability !== 'offline'), [drivers]);

  const memberEmails = (shipment) =>
    shipment.member_emails?.length
      ? shipment.member_emails
      : Array.from(new Set([tenant.owner_email, ...(tenant.member_emails || []), session?.user?.email].filter(Boolean)));

  const assign = async (shipment, driverEmail) => {
    setBusy(true);
    const driver = drivers.find((d) => d.email === driverEmail);
    await base44.entities.Shipment.update(shipment.id, {
      assigned_driver_email: driverEmail,
      status: shipment.status === 'created' ? 'picked_up' : shipment.status,
    });
    // Side channel: notify the agency's own endpoints that the parcel is out.
    base44.functions
      .invoke('shipmentWebhook', { shipment_id: shipment.id, event: 'shipment.status_changed' })
      .catch(() => null);
    if (driver) await base44.entities.TeamMember.update(driver.id, { availability: 'on_delivery' });
    await base44.entities.ShipmentEvent.create({
      tenant_id: tenant.id,
      shipment_id: shipment.id,
      tracking_number: shipment.tracking_number,
      status: shipment.status === 'created' ? 'picked_up' : shipment.status,
      event_type: 'note',
      location: `${shipment.receiver_city}, ${shipment.receiver_country}`,
      driver_email: driverEmail,
      note: `${t('dispatch.assign')} → ${driver?.full_name || driverEmail}`,
      occurred_at: new Date().toISOString(),
      visible_public: true,
      member_emails: memberEmails(shipment),
    });
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipment.id
          ? { ...s, assigned_driver_email: driverEmail, status: s.status === 'created' ? 'picked_up' : s.status }
          : s
      )
    );
    setBusy(false);
  };

  const autoAssign = async () => {
    setBusy(true);
    let pool = [...available];
    for (const shipment of pending) {
      if (!pool.length) break;
      const target = { lat: shipment.receiver_lat, lng: shipment.receiver_lng };
      const ranked = pool
        .map((driver) => ({
          driver,
          distance: haversineKm({ lat: driver.last_lat, lng: driver.last_lng }, target),
        }))
        .sort((a, b) => a.distance - b.distance);
      const chosen = ranked[0]?.driver;
      if (!chosen) break;
      await assign(shipment, chosen.email);
      pool = pool.filter((d) => d.id !== chosen.id);
    }
    setBusy(false);
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('portal.dispatch')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('dispatch.autoAssignHint')}</p>
        </div>
        <Button
          onClick={autoAssign}
          disabled={busy || !pending.length || !available.length}
          className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Zap className="mr-2 h-4 w-4" />
          {t('dispatch.autoAssign')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('dispatch.unassigned')}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-primary">{pending.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('dispatch.onRoad')}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-primary">{onRoad.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('fleet.available')}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-primary">{available.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-border bg-card">
          <h2 className="border-b border-border px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('dispatch.queue')}
          </h2>
          <div className="divide-y divide-border">
            {pending.length === 0 && <p className="px-6 py-10 text-sm text-muted-foreground">{t('dispatch.noQueue')}</p>}
            {pending.map((shipment) => (
              <div key={shipment.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <Link
                    to={`/portal/shipments/${shipment.id}`}
                    className="font-mono text-xs font-medium text-primary hover:text-accent"
                  >
                    {shipment.tracking_number}
                  </Link>
                  <p className="mt-1 text-sm font-medium text-primary">{shipment.receiver_name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[shipment.receiver_address, shipment.receiver_city].filter(Boolean).join(', ')}
                  </p>
                </div>
                <select
                  defaultValue=""
                  disabled={busy}
                  onChange={(event) => event.target.value && assign(shipment, event.target.value)}
                  className="rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">{t('dispatch.assign')}…</option>
                  {available.map((driver) => (
                    <option key={driver.id} value={driver.email}>
                      {driver.full_name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card">
          <h2 className="flex items-center gap-2 border-b border-border px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <RouteIcon className="h-4 w-4" />
            {t('dispatch.onRoad')}
          </h2>
          <div className="divide-y divide-border">
            {onRoad.length === 0 && <p className="px-6 py-10 text-sm text-muted-foreground">{t('common.noData')}</p>}
            {onRoad.map((shipment) => (
              <div key={shipment.id} className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono text-xs font-medium text-primary">{shipment.tracking_number}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {shipment.receiver_city} · {shipment.assigned_driver_email}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}