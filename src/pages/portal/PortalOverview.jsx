import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Package, Banknote, Users, Plus, Warehouse, Route, ArrowRight, Loader2 } from 'lucide-react';
import { formatMoney, SHIPMENT_STATUS_CLASS } from '@/lib/logistics';

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 font-heading text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export default function PortalOverview() {
  const { tenant, t, session } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [statusRows, codRows, driverRows, deliveredToday, shipments] = await Promise.all([
        api.entities.Shipment.aggregate({ query: { tenant_id: tenant.id }, groupBy: 'status' }),
        api.entities.CodEntry.aggregate({
          query: { tenant_id: tenant.id },
          groupBy: 'status',
          sum: 'amount',
        }),
        api.entities.TeamMember.aggregate({ query: { tenant_id: tenant.id, role: 'driver' }, groupBy: 'availability' }),
        api.entities.Shipment.count({
          tenant_id: tenant.id,
          status: 'delivered',
          pod_at: { $gte: new Date(Date.now() - 86400000).toISOString() },
        }),
        api.entities.Shipment.filter({ tenant_id: tenant.id }, { sort: '-created_date', limit: 6 }),
      ]);

      if (cancelled) return;

      const byStatus = {};
      (statusRows?.rows || []).forEach((row) => {
        byStatus[row.status] = row.count;
      });
      const active =
        (byStatus.created || 0) +
        (byStatus.picked_up || 0) +
        (byStatus.in_transit || 0) +
        (byStatus.at_hub || 0) +
        (byStatus.out_for_delivery || 0);

      let outstanding = 0;
      let collected = 0;
      (codRows?.rows || []).forEach((row) => {
        if (row.status === 'collected') collected += row.sum_amount || 0;
        if (row.status === 'pending') outstanding += row.sum_amount || 0;
      });

      let online = 0;
      (driverRows?.rows || []).forEach((row) => {
        if (row.availability !== 'offline') online += row.count;
      });

      setStats({
        active,
        deliveredToday,
        pendingPickup: byStatus.created || 0,
        outstanding,
        collected,
        online,
      });
      setRecent(shipments.items || []);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const actions = [
    { key: 'stats.newShipment', to: '/portal/shipments', icon: Plus },
    { key: 'stats.scanParcel', to: '/portal/hubs', icon: Warehouse },
    { key: 'stats.assignDriver', to: '/portal/dispatch', icon: Route },
    { key: 'stats.viewLedger', to: '/portal/cod', icon: Banknote },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">
          {t('portal.greeting', { name: session?.user?.full_name || '' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{tenant.name} · {tenant.city}, {tenant.country}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label={t('stats.activeShipments')} value={stats.active} />
        <StatCard icon={Package} label={t('stats.deliveredToday')} value={stats.deliveredToday} />
        <StatCard
          icon={Banknote}
          label={t('stats.codOutstanding')}
          value={formatMoney(stats.outstanding, tenant.currency)}
          hint={`${t('cod.collected')}: ${formatMoney(stats.collected, tenant.currency)}`}
        />
        <StatCard icon={Users} label={t('stats.fleetOnline')} value={stats.online} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('stats.recentShipments')}
            </h2>
            <Link to="/portal/shipments" className="flex items-center gap-1.5 text-xs font-medium text-accent">
              {t('common.view')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 && <p className="px-6 py-8 text-sm text-muted-foreground">{t('common.noData')}</p>}
            {recent.map((shipment) => (
              <Link
                key={shipment.id}
                to={`/portal/shipments/${shipment.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-primary">{shipment.tracking_number}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {shipment.receiver_name} · {shipment.receiver_city}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
                  }`}
                >
                  {t(`status.${shipment.status}`)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('stats.quickActions')}
          </h2>
          <div className="mt-5 space-y-2.5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.key}
                  to={action.to}
                  className="flex items-center gap-3 rounded-full border border-border px-4 py-3 text-sm font-medium text-primary transition hover:border-accent/60 hover:bg-accent/5"
                >
                  <Icon className="h-4 w-4 text-accent" />
                  {t(action.key)}
                </Link>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs uppercase tracking-wider text-primary-foreground/60">{t('sub.currentPlan')}</p>
            <p className="mt-1 font-heading text-lg font-semibold text-accent">{tenant.plan}</p>
            <p className="mt-1 text-xs text-primary-foreground/70">{t('sub.model')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}