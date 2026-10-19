import React from 'react';
import { Code2, Webhook, Store, ShieldCheck } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { FUNCTIONS_URL } from '@/lib/branding';

const ENDPOINTS = [
  { key: 'dev.endpointRate', action: 'rate', body: '{ "action": "rate", "dest_country": "Cameroon", "dest_city": "Douala", "weight_kg": 2 }' },
  {
    key: 'dev.endpointCreate',
    action: 'create',
    body: '{ "action": "create", "tenant_id": "<agency>", "merchant_ref": "ORDER-10233", "sender_name": "Your Store", "sender_phone": "+237600000000", "receiver_name": "Awa N.", "receiver_phone": "+237611111111", "receiver_city": "Douala", "receiver_country": "Cameroon", "receiver_address": "Rue 12, Bonapriso", "weight_kg": 1.5, "payment_mode": "cod", "cod_amount": 25000 }',
  },
  { key: 'dev.endpointTrack', action: 'track', body: '{ "action": "track", "numbers": ["ZEDOU12345678"] }' },
  { key: 'dev.endpointPod', action: 'pod', body: '{ "action": "pod", "tracking_number": "ZEDOU12345678" }' },
];

const WEBHOOK_EVENTS = ['shipment.created', 'shipment.status', 'shipment.delivered', 'shipment.pod'];

export default function Developers() {
  const { t } = useI18n();

  return (
    <SiteShell>
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            <Code2 className="h-3.5 w-3.5" />
            {t('dev.title')}
          </span>
          <h1 className="mt-6 max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t('dev.subtitle')}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-7">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/12 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-heading text-lg font-semibold text-primary">{t('dev.auth')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('dev.authDesc')}</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-primary p-4 text-xs text-primary-foreground">
{`curl -X POST ${FUNCTIONS_URL}/merchantApi \\
  -H "x-api-key: zx_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "rate", "dest_country": "Cameroon" }'`}
            </pre>
          </div>

          <div id="webhooks" className="scroll-mt-28 rounded-3xl border border-border bg-card p-7">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/12 text-accent">
              <Webhook className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-heading text-lg font-semibold text-primary">{t('dev.webhooks')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('dev.webhooksDesc')}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <li key={event} className="rounded-full bg-secondary px-3 py-1 font-mono text-[11px] text-primary">
                  {event}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h2 className="mt-16 font-heading text-2xl font-semibold tracking-tight text-primary">{t('dev.endpoints')}</h2>
        <div className="mt-6 space-y-4">
          {ENDPOINTS.map((endpoint) => (
            <article key={endpoint.action} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-primary px-2.5 py-1 font-mono text-[11px] font-semibold text-accent">
                  POST
                </span>
                <h3 className="font-heading text-base font-semibold text-primary">{t(endpoint.key)}</h3>
                <span className="font-mono text-xs text-muted-foreground">action: "{endpoint.action}"</span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-secondary p-4 font-mono text-[11px] leading-relaxed text-primary">
                {endpoint.body}
              </pre>
            </article>
          ))}
        </div>

        <div
          id="marketplaces"
          className="mt-16 flex scroll-mt-28 flex-col gap-4 rounded-3xl border border-accent/40 bg-accent/5 p-8 sm:flex-row sm:items-center"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Store className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-primary">{t('dev.marketplaceTitle')}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('dev.marketplaceDesc')}</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}