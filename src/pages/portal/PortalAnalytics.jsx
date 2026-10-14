import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Package, Banknote, Timer, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/lib/logistics';

const PIE_COLORS = ['#FF8E24', '#3D1E00', '#E0A458', '#2F7D6B', '#B8552F', '#8A8A8A', '#C9C1B8'];

function Card({ title, children, hint }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 font-heading text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function PortalAnalytics() {
  const { tenant, t } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const load = async () => {
      const [daily, byStatus, byCountry, delivered, failed, attempts] = await Promise.all([
        base44.entities.Shipment.aggregate({
          query: { tenant_id: tenant.id, created_date: { $gte: since } },
          dateBucket: { field: 'created_date', unit: 'day' },
          sum: 'total_amount',
        }),
        base44.entities.Shipment.aggregate({ query: { tenant_id: tenant.id }, groupBy: 'status' }),
        base44.entities.Shipment.aggregate({
          query: { tenant_id: tenant.id },
          groupBy: 'receiver_country',
          sort: '-count',
          limit: 6,
        }),
        base44.entities.Shipment.count({ tenant_id: tenant.id, status: 'delivered' }),
        base44.entities.Shipment.count({ tenant_id: tenant.id, status: { $in: ['failed', 'returned'] } }),
        base44.entities.Shipment.aggregate({
          query: { tenant_id: tenant.id, status: 'delivered' },
          avg: 'delivery_attempts',
        }),
      ]);
      if (cancelled) return;

      const dailyRows = (daily?.rows || [])
        .map((row) => ({
          day: String(row.created_date || row.day || row.date || '').slice(5, 10),
          volume: row.count || 0,
          revenue: Math.round(row.sum_total_amount || 0),
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

      const statusRows = (byStatus?.rows || []).map((row) => ({
        name: t(`status.${row.status}`),
        value: row.count || 0,
      }));

      const total = statusRows.reduce((acc, row) => acc + row.value, 0);
      const rate = total ? Math.round((delivered / total) * 100) : 0;

      setData({
        dailyRows,
        statusRows,
        countryRows: (byCountry?.rows || []).map((row) => ({
          country: row.receiver_country || '—',
          count: row.count || 0,
        })),
        shipments: total,
        revenue: dailyRows.reduce((acc, row) => acc + row.revenue, 0),
        rate,
        failed,
        avgAttempts: attempts?.rows?.[0]?.avg_delivery_attempts || 0,
      });
      setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  if (loading || !data) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const maxCountry = Math.max(1, ...data.countryRows.map((row) => row.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('stats.title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('stats.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Package} label={t('stats.totalShipments')} value={data.shipments} hint={t('stats.last30')} />
        <Kpi icon={Banknote} label={t('stats.totalRevenue')} value={formatMoney(data.revenue, tenant.currency)} />
        <Kpi icon={TrendingUp} label={t('stats.deliveryRate')} value={`${data.rate}%`} hint={`${data.failed} ${t('status.failed').toLowerCase()}`} />
        <Kpi
          icon={Timer}
          label={t('stats.avgAttempts')}
          value={Number(data.avgAttempts || 0).toFixed(2)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('stats.volumeChart')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyRows}>
                <defs>
                  <linearGradient id="zv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8E24" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF8E24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#8A8A8A" />
                <YAxis tick={{ fontSize: 11 }} stroke="#8A8A8A" allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="volume" stroke="#FF8E24" fill="url(#zv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('stats.revenueChart')}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRows}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#8A8A8A" />
                <YAxis tick={{ fontSize: 11 }} stroke="#8A8A8A" />
                <Tooltip formatter={(value) => formatMoney(value, tenant.currency)} />
                <Bar dataKey="revenue" fill="#3D1E00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t('stats.statusChart')}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusRows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.statusRows.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.statusRows.map((row, index) => (
              <span key={row.name} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] text-primary">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                {row.name} · {row.value}
              </span>
            ))}
          </div>
        </Card>

        <Card title={t('stats.destinationChart')}>
          <div className="space-y-4">
            {data.countryRows.length === 0 && <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>}
            {data.countryRows.map((row) => (
              <div key={row.country}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-primary">{row.country}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.round((row.count / maxCountry) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}