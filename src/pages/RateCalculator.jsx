import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Calculator, Loader2, Clock, Truck, ArrowRight } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { useCountry } from '@/components/site/useCountry';
import { Button } from '@/components/ui/button';
import { CITIES, COUNTRIES, SERVICE_TYPES, formatMoney } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

export default function RateCalculator() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { country } = useCountry();
  const [form, setForm] = useState({
    origin_country: country,
    origin_city: 'Douala',
    dest_country: country,
    dest_city: 'Yaoundé',
    weight_kg: 2,
    length: '',
    width: '',
    height: '',
    service_type: 'standard',
  });
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const response = await api.functions.invoke('quoteRate', {
        ...form,
        weight_kg: Number(form.weight_kg),
        dimensions: {
          l: Number(form.length) || 0,
          w: Number(form.width) || 0,
          h: Number(form.height) || 0,
        },
      });
      setQuotes(response.data?.quotes || []);
    } catch (err) {
      setError(err.message || t('rate.required'));
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const book = (quote) => {
    const params = new URLSearchParams({
      tenant_id: quote.tenant_id,
      service_type: quote.service_type,
      origin_country: form.origin_country,
      origin_city: form.origin_city,
      dest_country: form.dest_country,
      dest_city: form.dest_city,
      weight_kg: String(form.weight_kg),
    });
    navigate(`/send?${params.toString()}`);
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-secondary/50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('rate.title')}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t('rate.subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
              <Calculator className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-lg font-semibold text-primary">{t('rate.title')}</h2>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('rate.origin')}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <select className={inputClass} value={form.origin_country} onChange={update('origin_country')}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              className={inputClass}
              value={form.origin_city}
              onChange={update('origin_city')}
              list="zx-cities"
              autoComplete="off"
            />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('rate.destination')}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <select className={inputClass} value={form.dest_country} onChange={update('dest_country')}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              className={inputClass}
              value={form.dest_city}
              onChange={update('dest_city')}
              list="zx-cities"
              autoComplete="off"
            />
          </div>
          <datalist id="zx-cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('rate.weight')}</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className={`mt-1.5 ${inputClass}`}
                value={form.weight_kg}
                onChange={update('weight_kg')}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('rate.service')}</label>
              <select className={`mt-1.5 ${inputClass}`} value={form.service_type} onChange={update('service_type')}>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {t(`solutions.${s === 'express' ? 'expressName' : s === 'freight' ? 'freightName' : s === 'fulfillment' ? 'lastmileName' : 'supplyName'}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs font-medium text-muted-foreground">{t('rate.length')} / {t('rate.width')} / {t('rate.height')}</label>
            <div className="mt-1.5 grid grid-cols-3 gap-3">
              <input type="number" placeholder="L" className={inputClass} value={form.length} onChange={update('length')} />
              <input type="number" placeholder="W" className={inputClass} value={form.width} onChange={update('width')} />
              <input type="number" placeholder="H" className={inputClass} value={form.height} onChange={update('height')} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('rate.volume')}</p>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            data-testid="rate-submit"
            size="lg"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? t('rate.calculating') : t('rate.calculate')}
          </Button>
        </form>

        <div>
          <h2 className="font-heading text-lg font-semibold text-primary">{t('rate.results')}</h2>

          {loading && (
            <div className="mt-5 rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t('rate.calculating')}
            </div>
          )}

          {!loading && searched && quotes.length === 0 && (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t('rate.noResults')}
            </div>
          )}

          {!loading && quotes.length > 0 && (
            <div className="mt-5 space-y-4">
              {quotes.map((quote) => (
                <article key={quote.tenant_id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-primary">{quote.tenant_name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {quote.zone_name} · {[quote.tenant_city, quote.tenant_country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-xl font-semibold text-primary">
                        {formatMoney(quote.total_amount, quote.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('rate.chargeable')}: {quote.chargeable_weight_kg} kg
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-accent" />
                      {quote.service_type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      {t('rate.days', { days: quote.eta_days })}
                    </span>
                    <span>
                      {t('rate.base')}: {formatMoney(quote.base_price, quote.currency)}
                    </span>
                    {quote.surcharge_total > 0 && (
                      <span>
                        {t('rate.surcharges')}: {formatMoney(quote.surcharge_total, quote.currency)}
                      </span>
                    )}
                  </div>

                  {quote.surcharge_lines?.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {quote.surcharge_lines.map((line) => (
                        <li key={line.name} className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                          {line.name} · {formatMoney(line.amount, quote.currency)}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    onClick={() => book(quote)}
                    className="mt-5 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {t('rate.book')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}