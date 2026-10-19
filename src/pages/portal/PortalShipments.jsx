import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, escapeRegExp } from '@/api/client';
import { Search, Loader2, Filter } from 'lucide-react';
import { formatMoney, SHIPMENT_STATUS_CLASS, SHIPMENT_STATUS_ORDER } from '@/lib/logistics';

export default function PortalShipments() {
  const { tenant, t } = useOutletContext();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildQuery = useCallback(() => {
    const query = { tenant_id: tenant.id };
    if (status !== 'all') query.status = status;
    if (search.trim()) {
      query.$or = [
        { tracking_number: { $regex: escapeRegExp(search.trim()), $options: 'i' } },
        { receiver_name: { $regex: escapeRegExp(search.trim()), $options: 'i' } },
        { receiver_phone: { $regex: escapeRegExp(search.trim()), $options: 'i' } },
        { receiver_city: { $regex: escapeRegExp(search.trim()), $options: 'i' } },
      ];
    }
    return query;
  }, [tenant.id, status, search]);

  const load = useCallback(async () => {
    setLoading(true);
    const page = await api.entities.Shipment.filter(buildQuery(), { sort: '-created_date', limit: 25 });
    setItems(page.items || []);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    const timeout = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const page = await api.entities.Shipment.filter(buildQuery(), {
      sort: '-created_date',
      limit: 25,
      cursor,
    });
    setItems((prev) => [...prev, ...(page.items || [])]);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoadingMore(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('portal.shipments')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('ship.list')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('ship.searchPlaceholder')}
              className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent sm:w-72"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-input bg-card py-2.5 pl-10 pr-8 text-sm outline-none focus:border-accent"
            >
              <option value="all">{t('common.all')}</option>
              {[...SHIPMENT_STATUS_ORDER, 'failed', 'returned', 'cancelled'].map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted-foreground">{t('ship.none')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('ship.track')}</th>
                  <th className="px-6 py-3 font-medium">{t('ship.receiver')}</th>
                  <th className="px-6 py-3 font-medium">{t('ship.route')}</th>
                  <th className="px-6 py-3 font-medium">{t('ship.driverCol')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.amount')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((shipment) => (
                  <tr key={shipment.id} className="transition hover:bg-secondary/40">
                    <td className="px-6 py-4">
                      <Link
                        to={`/portal/shipments/${shipment.id}`}
                        className="font-mono text-xs font-medium text-primary hover:text-accent"
                      >
                        {shipment.tracking_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary">{shipment.receiver_name}</p>
                      <p className="text-xs text-muted-foreground">{shipment.receiver_phone}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {shipment.sender_city} → {shipment.receiver_city}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {shipment.assigned_driver_email || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-primary">
                        {formatMoney(shipment.total_amount, shipment.currency)}
                      </span>
                      {shipment.payment_mode === 'cod' && (
                        <span className="ml-2 rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          COD
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
                        }`}
                      >
                        {t(`status.${shipment.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-sm font-medium text-accent transition hover:text-accent/80"
            >
              {loadingMore ? t('common.loading') : t('common.view')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}