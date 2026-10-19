import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  PackageSearch,
  Search,
  Truck,
} from 'lucide-react';
import { detectProvider, providerLabel } from '@/lib/trackingProviders';
import ShipmentLiveTracker from '@/components/site/ShipmentLiveTracker';
import SiteShell from '@/components/site/SiteShell';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney, parseTrackingNumbers, SHIPMENT_STATUS_CLASS } from '@/lib/logistics';

const inputClass =
  'w-full rounded-none border border-input bg-card px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

function Timeline({ events }) {
  const { t } = useI18n();
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">{t('track.noEvents')}</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {events.map((event, index) => (
        <li key={`${event.occurred_at}-${index}`} className="relative">
          <span
            className={`absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full ring-4 ring-background ${
              index === 0 ? 'bg-accent' : 'bg-primary/25'
            }`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-heading text-sm font-semibold text-primary">{t(`event.${event.event_type}`)}</p>
            <span className="text-xs text-muted-foreground">{formatDate(event.occurred_at)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[event.location, event.hub_name].filter(Boolean).join(' · ')}
            {event.note ? ` — ${event.note}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}

function ExternalNumbers({ numbers }) {
  const { t, lang } = useI18n();
  return (
    <div className="rounded-none border border-border bg-card p-6">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary">
        {t('track.externalTitle')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('track.externalBody')}</p>
      <ul className="mt-5 space-y-3">
        {numbers.map(({ number, provider }) => (
          <li
            key={number}
            className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">{number}</p>
              <p className="mt-1 text-sm font-medium text-primary">
                {provider ? providerLabel(provider, lang) : t('track.unknownCarrier')}
              </p>
            </div>
            {provider && (
              <a
                href={provider.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {t('track.openCarrier', { carrier: providerLabel(provider, lang) })}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShipmentCard({ result }) {
  const { t } = useI18n();
  const shipment = result.shipment;
  // The carrying agency's own brand, so its tracking page looks like its own.
  const partner = result.partner;
  const latest = result.events[0];

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      {partner?.brand_color && (
        <div className="h-1.5 w-full" style={{ backgroundColor: partner.brand_color }} aria-hidden="true" />
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/50 px-6 py-5">
        <div className="flex items-center gap-3">
          {partner?.logo_url && (
            <Image
              src={partner.logo_url}
              alt={partner.name || shipment.tenant_name || ''}
              className="h-10 w-10 shrink-0"
              fittingType="fit"
            />
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.tracking')}</p>
            <p className="font-heading text-lg font-semibold tracking-tight text-primary">
              {shipment.tracking_number}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
          }`}
        >
          {t(`status.${shipment.status}`)}
        </span>
      </div>

      <ShipmentLiveTracker shipment={shipment} events={result.events} />

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" />
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.from')}</p>
                <p className="font-medium text-primary">
                  {[shipment.sender_city, shipment.sender_country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="my-3 ml-[7px] h-6 border-l border-dashed border-border" />
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <div className="text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.to')}</p>
                <p className="font-medium text-primary">
                  {[shipment.receiver_city, shipment.receiver_country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.partner')}</dt>
              <dd className="mt-1 font-medium text-primary">{shipment.tenant_name || partner?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.service')}</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-primary">
                <Truck className="h-3.5 w-3.5 text-accent" />
                {t(`rate.service`)} · {shipment.service_type}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.weight')}</dt>
              <dd className="mt-1 font-medium text-primary">
                {shipment.weight_kg} kg · {shipment.pieces} {t('ship.pieces')}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.eta')}</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-primary">
                <Clock className="h-3.5 w-3.5 text-accent" />
                {shipment.eta_date || '—'}
              </dd>
            </div>
            {shipment.payment_mode === 'cod' && (
              <div className="col-span-2 flex items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2.5 text-sm text-primary">
                <Banknote className="h-4 w-4 text-accent" />
                {t('track.cod')}: {formatMoney(shipment.cod_amount, shipment.currency)}
              </div>
            )}
            {shipment.status === 'delivered' && (
              <div className="col-span-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {t('track.deliveredTo')}: {shipment.pod_recipient_name || '—'} · {formatDate(shipment.pod_at)}
              </div>
            )}
            {shipment.delivery_attempts > 0 && shipment.status !== 'delivered' && (
              <div className="col-span-2 rounded-xl bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                {t('track.attempts')}: {shipment.delivery_attempts}
                {shipment.last_ndr_reason ? ` — ${t(`driver.ndrReasons.${shipment.last_ndr_reason}`)}` : ''}
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('track.timeline')}
          </h3>
          <div className="mt-5">
            <Timeline events={result.events} />
          </div>
        </div>
      </div>

      {latest && (
        <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
          {t('track.lastUpdate')}: {formatDate(latest.occurred_at)}
        </div>
      )}
    </article>
  );
}

export default function Track() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('numbers') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Numbers the Express network does not know are matched against the
  // international carriers so the customer can still follow the parcel.
  const searchedNumbers = parseTrackingNumbers(searchParams.get('numbers') || '');
  const outside = searchedNumbers
    .filter(
      (number) =>
        !results.some(
          (result) =>
            result.shipment.tracking_number === number.toUpperCase() ||
            result.shipment.waybill_number === number.toUpperCase()
        )
    )
    .map((number) => ({ number, provider: detectProvider(number) }));

  const run = useCallback(async (numbers) => {
    if (!numbers.length) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.functions.invoke('trackShipment', { numbers });
      setResults(response.data?.results || []);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [t]);

  useEffect(() => {
    const numbers = parseTrackingNumbers(searchParams.get('numbers') || '');
    if (numbers.length) run(numbers);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const numbers = parseTrackingNumbers(value);
    if (!numbers.length) return;
    setSearchParams({ numbers: numbers.join(',') });
    setValue(numbers.join(' '));
    run(numbers);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-secondary/50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('track.title')}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t('track.subtitle')}</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t('hero.trackPlaceholder')}
              className={inputClass}
            />
            <Button
              type="submit"
              data-testid="track-submit"
              size="lg"
              disabled={loading}
              className="shrink-0 rounded-none bg-accent px-9 text-accent-foreground hover:bg-accent/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {t('track.submit')}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {error && <p className="mb-6 text-sm text-destructive">{error}</p>}

        {loading && (
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        )}

        {!loading && searched && results.length === 0 && outside.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <PackageSearch className="h-7 w-7" />
            </span>
            <p className="mt-5 font-heading text-lg font-semibold text-primary">{t('track.empty')}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('hero.trackPlaceholder')}</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-6">
            {results.map((result) => (
              <ShipmentCard key={result.shipment.tracking_number} result={result} />
            ))}
          </div>
        )}

        {!loading && outside.length > 0 && (
          <div className="mt-6">
            <ExternalNumbers numbers={outside} />
          </div>
        )}

        {!searched && !loading && (
          <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
            {t('track.pending')}
          </div>
        )}
      </section>
    </SiteShell>
  );
}