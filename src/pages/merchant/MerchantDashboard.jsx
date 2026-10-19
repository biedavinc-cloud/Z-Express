import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, Package, Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '@/api/client';
import BrandMark from '@/components/site/BrandMark';
import MetricCard from '@/components/portal/MetricCard';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession } from '@/lib/session';
import ZSupportWidget from '@/components/support/ZSupportWidget';
import { formatMoney, formatDate, SHIPMENT_STATUS_CLASS } from '@/lib/logistics';

const ACTIVE_STATUSES = ['created', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery'];

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default function MerchantDashboard() {
  const { t, lang, setLang, languages } = useI18n();
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then(async (resolved) => {
      if (cancelled) return;
      setSession(resolved);
      if (!resolved.user) {
        setLoading(false);
        return;
      }
      const email = resolved.user.email;
      const scope = { merchant_email: email };

      const [active, deliveredMonth, spendAgg, channelAgg, recent] = await Promise.all([
        api.entities.Shipment.filter(
          { ...scope, status: { $in: ACTIVE_STATUSES } },
          { sort: '-created_date', limit: 20 }
        ),
        api.entities.Shipment.count({ ...scope, status: 'delivered', pod_at: { $gte: monthStart() } }),
        api.entities.Shipment.aggregate({ query: scope, sum: 'total_amount' }),
        api.entities.Shipment.aggregate({
          query: scope,
          groupBy: 'source',
          sum: 'total_amount',
          max: 'created_date',
          sort: '-count',
        }),
        api.entities.Shipment.filter(scope, { sort: '-created_date', limit: 12 }),
      ]);

      const recentShipments = recent.items || [];
      const ids = recentShipments.map((shipment) => shipment.id);
      const events = ids.length
        ? await api.entities.ShipmentEvent.filter(
            { shipment_id: { $in: ids } },
            { sort: '-occurred_at', limit: 10 }
          )
        : { items: [] };

      if (cancelled) return;
      setData({
        active: active.items || [],
        activeCount: active.items?.length || 0,
        deliveredMonth,
        spend: spendAgg.rows?.[0]?.sum_total_amount || 0,
        channels: channelAgg.rows || [],
        recent: recentShipments,
        events: events.items || [],
        currency: recentShipments[0]?.currency || 'USD',
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!session?.user) return <Navigate to="/login" replace />;
  if (session.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (['tenant_admin', 'hub_supervisor', 'dispatcher', 'driver'].includes(session.role)) {
    return <Navigate to="/portal" replace />;
  }

  const stale = (value) => {
    if (!value) return true;
    return Date.now() - new Date(value).getTime() > 30 * 86400000;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="zx-safe-top border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/">
            <BrandMark variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-foreground/60 sm:block">{session.user.email}</span>
            {languages.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold uppercase transition ${
                  lang === code ? 'bg-accent text-accent-foreground' : 'text-primary-foreground/60'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/my-shipments" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('merchant.title')}
        </Link>
        <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-primary">{t('md.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('md.subtitle')}</p>

        {!data ? null : data.recent.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Package className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{t('md.empty')}</p>
            <Link to="/send" className="mt-5 inline-block text-sm font-medium text-accent">
              {t('md.book')} →
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                icon={Truck}
                label={t('md.active')}
                value={data.activeCount}
                hint={t('md.activeHint')}
              />
              <MetricCard icon={CheckCircle2} label={t('md.deliveredMonth')} value={data.deliveredMonth} />
              <MetricCard
                icon={Package}
                label={t('md.spend')}
                value={formatMoney(data.spend, data.currency)}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('md.channels')}
                </h2>
                <div className="mt-4 space-y-2">
                  {data.channels.map((channel) => (
                    <div
                      key={channel.source}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize text-primary">{channel.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(channel.max_created_date, false)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-sm font-semibold text-primary">{channel.count}</p>
                        <span
                          className={`text-[11px] font-semibold ${
                            stale(channel.max_created_date) ? 'text-muted-foreground' : 'text-emerald-700'
                          }`}
                        >
                          {stale(channel.max_created_date) ? t('md.healthIdle') : t('md.healthLive')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('md.updates')}
                </h2>
                {data.events.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t('md.noUpdates')}</p>
                ) : (
                  <div className="mt-3 space-y-1">
                    {data.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 py-2.5 last:border-0"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{event.tracking_number}</span>
                        <span className="text-sm font-medium text-primary">{t(`event.${event.event_type}`)}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDate(event.occurred_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('md.orders')}
              </h2>
              <div className="mt-4 space-y-2">
                {data.recent.map((shipment) => (
                  <Link
                    key={shipment.id}
                    to={`/track?numbers=${shipment.tracking_number}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition hover:border-accent/50"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{shipment.tracking_number}</p>
                      <p className="mt-0.5 text-sm text-primary">
                        {shipment.sender_city} → {shipment.receiver_city}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-sm font-semibold text-primary">
                        {formatMoney(shipment.total_amount, shipment.currency)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
                        }`}
                      >
                        {t(`status.${shipment.status}`)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <ZSupportWidget
        context={{
          space: 'merchant_dashboard',
          name: session.user.full_name || session.user.email,
          carrier: session.tenant?.name || null,
          active_shipments: data?.activeCount ?? 0,
          delivered_this_month: data?.deliveredMonth ?? 0,
          total_spend: data?.spend ?? 0,
          currency: data?.currency || null,
          channels: (data?.channels || []).map((channel) => channel.source),
        }}
      />
    </div>
  );
}