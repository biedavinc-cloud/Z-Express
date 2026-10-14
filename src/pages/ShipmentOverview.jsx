import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import StaffPage from '@/components/portal/StaffPage';
import MetricCard from '@/components/portal/MetricCard';
import useStaffScope from '@/hooks/useStaffScope';
import { formatMoney, formatDate, SHIPMENT_STATUS_CLASS, SHIPMENT_STATUS_ORDER } from '@/lib/logistics';
import { useShipmentOverview } from '@/hooks/useShipmentOverview';

const ACTIVE_STATUSES = ['created', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery'];
const CLOSED_STATUSES = ['failed', 'returned', 'cancelled'];

export default function ShipmentOverview() {
  const { t } = useI18n();
  const scope = useStaffScope();
  const tenant = scope?.tenant || null;
  const { data, loading } = useShipmentOverview(tenant);

  const rows = data?.statusRows || [];
  const countFor = (status) => rows.find((row) => row.status === status)?.count || 0;
  const activeLoad = ACTIVE_STATUSES.reduce((total, status) => total + countFor(status), 0);
  const pipeline = [...SHIPMENT_STATUS_ORDER, ...CLOSED_STATUSES];

  const tasks = [
    {
      label: t('ovw.pendingDispatch'),
      count: data?.unassigned || 0,
      to: '/portal/dispatch',
    },
    { label: t('ovw.pendingPod'), count: data?.podMissing || 0, to: '/portal/shipments' },
    { label: t('ovw.pendingNdr'), count: data?.failed || 0, to: '/portal/tickets' },
    { label: t('ovw.pendingCod'), count: data?.codPendingCount || 0, to: '/portal/cod' },
  ].filter((task) => task.count > 0);

  return (
    <StaffPage title={t('ovw.title')} subtitle={t('ovw.subtitle')}>
      {loading || !data ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : data.total === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Package className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm text-muted-foreground">{t('ovw.empty')}</p>
          <Link to="/send" className="mt-5 inline-block text-sm font-medium text-accent">
            {t('ship.title')} →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Package}
              label={t('ovw.activeLoad')}
              value={activeLoad}
              hint={t('ovw.activeLoadHint')}
            />
            <MetricCard icon={CheckCircle2} label={t('ovw.deliveredToday')} value={data.deliveredToday} />
            <MetricCard icon={AlertTriangle} label={t('ovw.failed')} value={data.failed} />
            <MetricCard
              icon={Banknote}
              label={t('ovw.codPending')}
              value={formatMoney(data.codPendingAmount, tenant?.currency || 'USD')}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ovw.pipeline')}
              </h2>
              <div className="mt-5 space-y-2">
                {pipeline.map((status) => {
                  const row = rows.find((item) => item.status === status);
                  const value = row?.count || 0;
                  const share = data.total ? Math.round((value / data.total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span
                        className={`w-32 shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                          SHIPMENT_STATUS_CLASS[status] || SHIPMENT_STATUS_CLASS.created
                        }`}
                      >
                        {t(`status.${status}`)}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${share}%` }}
                        />
                      </span>
                      <span className="w-10 text-right font-heading text-sm font-semibold text-primary">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ovw.pending')}
              </h2>
              {tasks.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">{t('ovw.noPending')}</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {tasks.map((task) => (
                    <Link
                      key={task.label}
                      to={task.to}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition hover:border-accent/50"
                    >
                      <span className="text-sm text-primary">{task.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-accent/12 px-2.5 py-0.5 font-heading text-sm font-semibold text-accent">
                          {task.count}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ovw.recentEvents')}
              </h2>
              <Link to="/portal/shipments" className="text-xs font-medium text-accent">
                {t('ovw.openList')} →
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              {(data.events || []).map((event) => (
                <div key={event.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 py-2.5 last:border-0">
                  <span className="font-mono text-xs text-muted-foreground">{event.tracking_number}</span>
                  <span className="text-sm font-medium text-primary">{t(`event.${event.event_type}`)}</span>
                  <span className="text-xs text-muted-foreground">{event.location}</span>
                  {event.driver_email && (
                    <span className="text-xs text-muted-foreground">{event.driver_email}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(event.occurred_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </StaffPage>
  );
}