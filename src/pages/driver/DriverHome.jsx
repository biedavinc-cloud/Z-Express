import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, MapPin, Phone, Banknote, ChevronRight, Power, Package } from 'lucide-react';
import BrandMark from '@/components/site/BrandMark';
import GpsTracker from '@/components/driver/GpsTracker';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession } from '@/lib/session';
import { formatMoney } from '@/lib/logistics';
import ZSupportWidget from '@/components/support/ZSupportWidget';

export default function DriverHome() {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then(async (resolved) => {
      if (cancelled) return;
      setSession(resolved);
      if (!resolved.user) return;
      const page = await api.entities.Shipment.filter(
        {
          assigned_driver_email: resolved.user.email,
          status: { $in: ['picked_up', 'in_transit', 'at_hub', 'out_for_delivery', 'created'] },
        },
        { sort: 'created_date', limit: 40 }
      );
      if (cancelled) return;
      setShipments(page.items || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (session && !session.user && !loading) return <Navigate to="/login" replace />;

  const toggleAvailability = async () => {
    if (!session?.member) return;
    setBusy(true);
    const next = session.member.availability === 'offline' ? 'available' : 'offline';
    await api.entities.TeamMember.update(session.member.id, { availability: next });
    setSession((prev) => ({ ...prev, member: { ...prev.member, availability: next } }));
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const online = session?.member?.availability !== 'offline';

  return (
    <div className="min-h-screen bg-secondary/40 pb-24">
      <header className="zx-safe-top bg-primary px-5 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <BrandMark variant="light" />
          <button
            type="button"
            onClick={toggleAvailability}
            disabled={busy || !session?.member}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              online ? 'bg-accent text-accent-foreground' : 'border border-primary-foreground/25 text-primary-foreground/70'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {online ? t('driver.online') : t('driver.offline')}
          </button>
        </div>
        <div className="mx-auto mt-7 max-w-2xl">
          <h1 className="font-heading text-2xl font-semibold">{t('driver.title')}</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            {session?.user?.full_name} · {session?.tenant?.name || t('portal.driverApp')}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-5 max-w-2xl px-5">
        <GpsTracker tenantId={session?.tenant?.id} autoStart />

        <div className="mt-4 rounded-3xl border border-border bg-card p-2 zx-shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('driver.todayStops')}
            </p>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              {shipments.length}
            </span>
          </div>

          <div className="space-y-2 px-2 pb-2">
            {shipments.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t('driver.noStops')}</p>
            )}
            {shipments.map((shipment) => (
              <Link
                key={shipment.id}
                to={`/driver/${shipment.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border px-4 py-4 transition hover:border-accent/50 hover:bg-accent/5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Package className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-xs text-muted-foreground">{shipment.tracking_number}</span>
                  <span className="mt-0.5 block truncate font-medium text-primary">{shipment.receiver_name}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-accent" />
                    <span className="truncate">{shipment.receiver_address || shipment.receiver_city}</span>
                  </span>
                  {shipment.payment_mode === 'cod' && shipment.cod_amount > 0 && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-1 text-[11px] font-semibold text-accent">
                      <Banknote className="h-3 w-3" />
                      {formatMoney(shipment.cod_amount, shipment.currency)}
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/portal"
            className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium text-primary transition hover:border-accent"
          >
            {t('portal.overview')}
          </Link>
          <a
            href={`tel:${session?.member?.phone || ''}`}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium text-primary transition hover:border-accent"
          >
            <Phone className="h-4 w-4 text-accent" />
            {t('driver.call')}
          </a>
        </div>
      </main>

      <ZSupportWidget
        context={{
          space: 'driver_app',
          name: session?.user?.full_name || session?.user?.email || null,
          carrier: session?.tenant?.name || null,
          availability: online ? 'available' : 'offline',
          todays_stops: shipments.length,
        }}
      />
    </div>
  );
}