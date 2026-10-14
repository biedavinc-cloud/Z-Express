import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LayoutGrid, List, Camera, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/components/LanguageProvider';
import StaffPage from '@/components/portal/StaffPage';
import PodCard from '@/components/pod/PodCard';
import useStaffScope from '@/hooks/useStaffScope';
import { formatDate } from '@/lib/logistics';

export default function ProofOfDelivery() {
  const { t } = useI18n();
  const scope = useStaffScope();
  const tenant = scope?.tenant || null;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('gallery');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.id) return undefined;
    let cancelled = false;
    setLoading(true);

    const query = { tenant_id: tenant.id, pod_at: { $exists: true } };
    const term = search.trim();
    if (term) {
      query.$or = [
        { tracking_number: { $regex: term, $options: 'i' } },
        { receiver_name: { $regex: term, $options: 'i' } },
      ];
    }

    Promise.all([
      base44.entities.Shipment.filter(query, { sort: '-pod_at', limit: 24 }),
      base44.entities.Shipment.count({ tenant_id: tenant.id, pod_at: { $exists: true } }),
    ]).then(([page, count]) => {
      if (cancelled) return;
      setItems(page.items || []);
      setTotal(count);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tenant?.id, search]);

  const toggleClass = (active) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
    }`;

  return (
    <StaffPage title={t('pod.title')} subtitle={t('pod.subtitle')}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pod.search')}
              className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setView('gallery')} className={toggleClass(view === 'gallery')}>
              <LayoutGrid className="h-4 w-4" />
              {t('pod.gallery')}
            </button>
            <button type="button" onClick={() => setView('list')} className={toggleClass(view === 'list')}>
              <List className="h-4 w-4" />
              {t('pod.list')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Camera className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{t('pod.empty')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('pod.count', { count: total })}
            </p>

            {view === 'gallery' ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((shipment) => (
                  <PodCard key={shipment.id} shipment={shipment} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">{t('logs.colShipment')}</th>
                      <th className="px-5 py-3">{t('pod.recipient')}</th>
                      <th className="px-5 py-3">{t('pod.signedAt')}</th>
                      <th className="px-5 py-3">{t('ovw.colCount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((shipment) => (
                      <tr key={shipment.id} className="border-t border-border/60">
                        <td className="px-5 py-3">
                          <Link
                            to={`/portal/shipments/${shipment.id}`}
                            className="font-mono text-xs text-accent"
                          >
                            {shipment.tracking_number}
                          </Link>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {shipment.receiver_city}, {shipment.receiver_country}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-primary">{shipment.pod_recipient_name || '—'}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(shipment.pod_at)}</td>
                        <td className="px-5 py-3">
                          <span className="flex flex-wrap gap-1.5">
                            {shipment.pod_signature && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                {t('pod.signature')}
                              </span>
                            )}
                            {shipment.pod_photo_uri && (
                              <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                                {t('pod.photo')}
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </StaffPage>
  );
}