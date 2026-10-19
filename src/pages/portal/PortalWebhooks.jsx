import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Plus, Webhook, Trash2, Zap, Copy } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { scopeForEntity } from '@/lib/session';
import { formatDate } from '@/lib/logistics';

const EVENTS = [
  'shipment.created',
  'shipment.status_changed',
  'shipment.delivered',
  'shipment.failed',
  'pod.created',
];

const field =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const BLANK = { label: '', url: '', events: [], secret: '', active: true };

// The signing secret guards the agency's payloads, so it is drawn from the
// browser's cryptographically secure generator rather than a predictable one.
function randomSecret() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return `whsec_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export default function PortalWebhooks() {
  const { tenant, t, session } = useOutletContext();
  const [endpoints, setEndpoints] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [latestShipment, setLatestShipment] = useState(null);
  const [draft, setDraft] = useState(null);
  const [state, setState] = useState('');
  const [tab, setTab] = useState('endpoints');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [endpointPage, deliveryPage, shipmentPage] = await Promise.all([
      api.entities.WebhookEndpoint.filter({ tenant_id: tenant.id }, { sort: '-created_date', limit: 50 }),
      api.entities.WebhookDelivery.filter(
        { tenant_id: tenant.id, ...(state === 'ok' ? { success: true } : state === 'failed' ? { success: false } : {}) },
        { sort: '-delivered_at', limit: 40 }
      ),
      api.entities.Shipment.filter(
        { tenant_id: tenant.id },
        { sort: '-created_date', limit: 1, fields: ['tracking_number'] }
      ),
    ]);
    setEndpoints(endpointPage.items || []);
    setDeliveries(deliveryPage.items || []);
    setLatestShipment((shipmentPage.items || [])[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id, state]);

  const save = async () => {
    if (!draft?.url || !draft?.label) return;
    setBusy(true);
    const payload = {
      label: draft.label,
      url: draft.url,
      events: draft.events,
      secret: draft.secret || randomSecret(),
      active: draft.active,
    };
    if (draft.id) await api.entities.WebhookEndpoint.update(draft.id, payload);
    else
      await api.entities.WebhookEndpoint.create({
        ...payload,
        ...(await scopeForEntity(tenant, 'WebhookEndpoint', session?.user?.email)),
      });
    setBusy(false);
    setDraft(null);
    toast({ title: t('wh.saved') });
    load();
  };

  const remove = async (endpoint) => {
    await api.entities.WebhookEndpoint.delete(endpoint.id);
    toast({ title: t('wh.removed') });
    load();
  };

  const sendTest = async () => {
    if (!latestShipment) return;
    const response = await api.functions.invoke('shipmentWebhook', {
      shipment_id: latestShipment.id,
      event: 'shipment.status_changed',
    });
    toast({
      title: t('wh.testSent'),
      description: `${response?.data?.endpoints_notified ?? 0} · ${latestShipment.tracking_number}`,
    });
    setState('');
    load();
  };

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: t('wh.copied') });
    } catch {
      // Clipboard access can be denied; the value stays visible to copy by hand.
    }
  };

  const cell = 'px-4 py-3';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('wh.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('wh.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={sendTest}
            disabled={!latestShipment}
          >
            <Zap className="mr-2 h-4 w-4" />
            {t('wh.test')}
          </Button>
          <Button
            onClick={() => setDraft({ ...BLANK, secret: randomSecret() })}
            className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('wh.new')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'endpoints', key: 'wh.endpoints' },
          { id: 'deliveries', key: 'wh.deliveries' },
        ].map((item) => (
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

      {draft && (
        <div className="rounded-3xl border border-accent/40 bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('wh.label')}</Label>
              <input
                className={field}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('wh.url')}</Label>
              <input
                className={field}
                placeholder="https://example.com/webhooks/express"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('wh.secret')}</Label>
              <div className="flex gap-2">
                <Input
                  value={draft.secret}
                  onChange={(e) => setDraft({ ...draft, secret: e.target.value })}
                />
                <Button
                  variant="outline"
                  type="button"
                  className="rounded-xl"
                  onClick={() => setDraft({ ...draft, secret: randomSecret() })}
                >
                  {t('wh.generate')}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <Label>{t('wh.active')}</Label>
              <Switch
                checked={draft.active}
                onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('wh.events')}</Label>
              <div className="flex flex-wrap gap-2">
                {EVENTS.map((event) => {
                  const on = draft.events.includes(event);
                  return (
                    <button
                      key={event}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          events: on ? draft.events.filter((item) => item !== event) : [...draft.events, event],
                        })
                      }
                      className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition ${
                        on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {event}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={save}
              disabled={busy}
              className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('wh.save')}
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={() => setDraft(null)}>
              {t('wh.cancel')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : tab === 'endpoints' ? (
        endpoints.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Webhook className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">{t('wh.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-semibold text-primary">{endpoint.label}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{endpoint.url}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      endpoint.active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {endpoint.active ? t('wh.active') : t('perm.suspended')}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {endpoint.events.length === 0 ? (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                      {t('wh.events')}: {EVENTS.length}
                    </span>
                  ) : (
                    endpoint.events.map((event) => (
                      <span
                        key={event}
                        className="rounded-full bg-accent/12 px-2.5 py-1 font-mono text-[11px] text-accent"
                      >
                        {event}
                      </span>
                    ))
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{t('logs.colStatus')}</dt>
                    <dd className="font-medium text-primary">{endpoint.last_status || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('wh.colWhen')}</dt>
                    <dd className="font-medium text-primary">{formatDate(endpoint.last_delivery_at)}</dd>
                  </div>
                </dl>

                {endpoint.last_error && (
                  <p className="mt-3 truncate text-xs text-destructive">{endpoint.last_error}</p>
                )}

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setDraft({ ...endpoint })}
                  >
                    {t('zones.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => copy(endpoint.secret || '')}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {t('wh.secret')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-xl text-destructive"
                    onClick={() => remove(endpoint)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <select
            className="rounded-2xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">{t('logs.colStatus')}</option>
            <option value="ok">{t('wh.ok')}</option>
            <option value="failed">{t('wh.failed')}</option>
          </select>

          {deliveries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <p className="text-sm text-muted-foreground">{t('wh.logEmpty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className={cell}>{t('wh.colEvent')}</th>
                    <th className={cell}>{t('wh.colEndpoint')}</th>
                    <th className={cell}>{t('logs.colReference')}</th>
                    <th className={cell}>{t('wh.colResponse')}</th>
                    <th className={cell}>{t('wh.colDuration')}</th>
                    <th className={cell}>{t('wh.colWhen')}</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-t border-border/60">
                      <td className={`${cell} font-mono text-xs text-primary`}>{delivery.event}</td>
                      <td className={`${cell} text-muted-foreground`}>{delivery.label}</td>
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
                          {delivery.status_code || t('wh.failed')}
                        </span>
                        {delivery.error && (
                          <span className="mt-0.5 block max-w-[200px] truncate text-xs text-muted-foreground">
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
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}