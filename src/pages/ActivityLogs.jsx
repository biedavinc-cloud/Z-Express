import React, { useEffect, useState } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { api, escapeRegExp } from '@/api/client';
import { useI18n } from '@/components/LanguageProvider';
import StaffPage from '@/components/portal/StaffPage';
import useStaffScope from '@/hooks/useStaffScope';
import { formatDate } from '@/lib/logistics';

const EVENT_TYPES = [
  'created',
  'scan_in',
  'scan_out',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'ndr',
  'note',
  'pod',
];

const TABS = [
  { id: 'events', key: 'logs.tabEvents' },
  { id: 'webhooks', key: 'logs.tabWebhooks' },
  { id: 'billing', key: 'logs.tabBilling' },
];

const selectClass =
  'rounded-2xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

// One builder for the first page and for "load more", so a pagination cursor is
// always paired with the filters it was created for.
function buildQuery({ tenantId, tab, eventType, term, webhookState }) {
  const query = { tenant_id: tenantId };
  if (tab === 'events') {
    if (eventType) query.event_type = eventType;
    if (term) {
      query.$or = [
        { tracking_number: { $regex: escapeRegExp(term), $options: 'i' } },
        { driver_email: { $regex: escapeRegExp(term), $options: 'i' } },
        { note: { $regex: escapeRegExp(term), $options: 'i' } },
      ];
    }
    return query;
  }
  if (webhookState === 'ok') query.success = true;
  if (webhookState === 'failed') query.success = false;
  return query;
}

export default function ActivityLogs() {
  const { t } = useI18n();
  const scope = useStaffScope();
  const tenant = scope?.tenant || null;

  const [tab, setTab] = useState('events');
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [webhookState, setWebhookState] = useState('');
  const [rows, setRows] = useState([]);
  const [account, setAccount] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.id) return undefined;
    let cancelled = false;
    setLoading(true);
    setRows([]);
    setCursor(null);

    const tenantId = tenant.id;
    const term = search.trim();

    const load = async () => {
      if (tab === 'events') {
        const query = buildQuery({ tenantId, tab, eventType, term, webhookState });
        const page = await api.entities.ShipmentEvent.filter(query, {
          sort: '-occurred_at',
          limit: 40,
        });
        return { items: page.items || [], next: page.next_cursor, more: page.has_more };
      }
      if (tab === 'webhooks') {
        const query = buildQuery({ tenantId, tab, eventType, term, webhookState });
        const page = await api.entities.WebhookDelivery.filter(query, {
          sort: '-delivered_at',
          limit: 40,
        });
        return { items: page.items || [], next: page.next_cursor, more: page.has_more };
      }
      const [invoices, subscriptions, members] = await Promise.all([
        api.entities.Invoice.filter({ tenant_id: tenantId }, { sort: '-issued_at', limit: 20 }),
        api.entities.Subscription.filter({ tenant_id: tenantId }, { sort: '-created_date', limit: 5 }),
        api.entities.TeamMember.filter({ tenant_id: tenantId }, { sort: '-created_date', limit: 20 }),
      ]);
      const merged = [
        ...(invoices.items || []).map((invoice) => ({
          id: `inv-${invoice.id}`,
          title: `${invoice.number} · ${invoice.plan}`,
          detail: `${invoice.amount} ${invoice.currency} · ${invoice.status}`,
          at: invoice.issued_at || invoice.created_date,
        })),
        ...(subscriptions.items || []).map((subscription) => ({
          id: `sub-${subscription.id}`,
          title: `${t('sub.currentPlan')} · ${subscription.plan}`,
          detail: subscription.status,
          at: subscription.created_date,
        })),
        ...(members.items || []).map((member) => ({
          id: `mem-${member.id}`,
          title: `${member.full_name || member.email} · ${t(`role.${member.role}`)}`,
          detail: member.status,
          at: member.created_date,
        })),
      ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
      return { items: merged, next: null, more: false };
    };

    load().then((result) => {
      if (cancelled) return;
      if (tab === 'billing') setAccount(result.items);
      else setRows(result.items);
      setCursor(result.next);
      setHasMore(Boolean(result.more));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tenant?.id, tab, search, eventType, webhookState]);

  const loadMore = async () => {
    if (!cursor) return;
    const query = buildQuery({ tenantId: tenant.id, tab, eventType, term: search.trim(), webhookState });
    const page =
      tab === 'events'
        ? await api.entities.ShipmentEvent.filter(query, { sort: '-occurred_at', limit: 40, cursor })
        : await api.entities.WebhookDelivery.filter(query, { sort: '-delivered_at', limit: 40, cursor });
    setRows((current) => [...current, ...(page.items || [])]);
    setCursor(page.next_cursor);
    setHasMore(Boolean(page.has_more));
  };

  const visible = tab === 'billing' ? account : rows;
  const cell = 'px-5 py-3';

  return (
    <StaffPage title={t('logs.title')} subtitle={t('logs.subtitle')}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === item.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          {tab === 'events' && (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('logs.search')}
                className={`${selectClass} w-full max-w-xs`}
              />
              <select className={selectClass} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="">{t('logs.tabEvents')}</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`event.${type}`)}</option>
                ))}
              </select>
            </>
          )}

          {tab === 'webhooks' && (
            <select className={selectClass} value={webhookState} onChange={(e) => setWebhookState(e.target.value)}>
              <option value="">{t('logs.colStatus')}</option>
              <option value="ok">{t('wh.ok')}</option>
              <option value="failed">{t('wh.failed')}</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <ScrollText className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">
              {tab === 'webhooks' ? t('wh.logEmpty') : t('logs.empty')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  {tab === 'events' && (
                    <tr>
                      <th className={cell}>{t('logs.colEvent')}</th>
                      <th className={cell}>{t('logs.colShipment')}</th>
                      <th className={cell}>{t('logs.colLocation')}</th>
                      <th className={cell}>{t('logs.colActor')}</th>
                      <th className={cell}>{t('logs.colWhen')}</th>
                    </tr>
                  )}
                  {tab === 'webhooks' && (
                    <tr>
                      <th className={cell}>{t('logs.colEvent')}</th>
                      <th className={cell}>{t('logs.colEndpoint')}</th>
                      <th className={cell}>{t('logs.colReference')}</th>
                      <th className={cell}>{t('logs.colResponse')}</th>
                      <th className={cell}>{t('logs.colDuration')}</th>
                      <th className={cell}>{t('logs.colWhen')}</th>
                    </tr>
                  )}
                  {tab === 'billing' && (
                    <tr>
                      <th className={cell}>{t('logs.colEvent')}</th>
                      <th className={cell}>{t('logs.colStatus')}</th>
                      <th className={cell}>{t('logs.colWhen')}</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {tab === 'events' &&
                    rows.map((event) => (
                      <tr key={event.id} className="border-t border-border/60">
                        <td className={cell}>
                          <span className="font-medium text-primary">{t(`event.${event.event_type}`)}</span>
                          {event.note && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">{event.note}</span>
                          )}
                        </td>
                        <td className={`${cell} font-mono text-xs text-muted-foreground`}>
                          {event.tracking_number}
                        </td>
                        <td className={`${cell} text-muted-foreground`}>
                          {event.hub_name || event.location || '—'}
                        </td>
                        <td className={`${cell} text-muted-foreground`}>{event.driver_email || '—'}</td>
                        <td className={`${cell} text-muted-foreground`}>{formatDate(event.occurred_at)}</td>
                      </tr>
                    ))}

                  {tab === 'webhooks' &&
                    rows.map((delivery) => (
                      <tr key={delivery.id} className="border-t border-border/60">
                        <td className={`${cell} font-mono text-xs text-primary`}>{delivery.event}</td>
                        <td className={`${cell} text-muted-foreground`}>
                          {delivery.label}
                          <span className="mt-0.5 block max-w-[220px] truncate text-xs">{delivery.url}</span>
                        </td>
                        <td className={`${cell} font-mono text-xs text-muted-foreground`}>
                          {delivery.payload_ref || '—'}
                        </td>
                        <td className={cell}>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              delivery.success
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {delivery.status_code || (delivery.success ? t('wh.ok') : t('wh.failed'))}
                          </span>
                          {delivery.error && (
                            <span className="mt-0.5 block max-w-[220px] truncate text-xs text-muted-foreground">
                              {delivery.error}
                            </span>
                          )}
                        </td>
                        <td className={`${cell} text-muted-foreground`}>{delivery.duration_ms} ms</td>
                        <td className={`${cell} text-muted-foreground`}>
                          {formatDate(delivery.delivered_at || delivery.created_date)}
                        </td>
                      </tr>
                    ))}

                  {tab === 'billing' &&
                    account.map((entry) => (
                      <tr key={entry.id} className="border-t border-border/60">
                        <td className={`${cell} font-medium text-primary`}>{entry.title}</td>
                        <td className={`${cell} text-muted-foreground`}>{entry.detail}</td>
                        <td className={`${cell} text-muted-foreground`}>{formatDate(entry.at)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {tab !== 'billing' && hasMore && (
              <button
                type="button"
                onClick={loadMore}
                className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-primary"
              >
                {t('logs.loadMore')}
              </button>
            )}
          </>
        )}
      </div>
    </StaffPage>
  );
}