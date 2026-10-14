import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Banknote, CheckCircle2, Copy, Loader2, PackageCheck, Wallet } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { useCountry } from '@/components/site/useCountry';
import { Button } from '@/components/ui/button';
import { CITIES, COUNTRIES, SERVICE_TYPES, formatMoney } from '@/lib/logistics';
import { DEFAULT_GOODS, GOODS_CATEGORIES, goodsLabel } from '@/lib/goods';
import { railLabel } from '@/lib/payments';

const inputClass =
  'w-full rounded-none border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

const STEPS = ['ship.step1', 'ship.step2', 'ship.step3'];

export default function CreateShipment() {
  const { t, lang } = useI18n();
  const { country } = useCountry();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [quotes, setQuotes] = useState([]);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    origin_country: params.get('origin_country') || country,
    origin_city: params.get('origin_city') || 'Douala',
    dest_country: params.get('dest_country') || country,
    dest_city: params.get('dest_city') || 'Yaoundé',
    service_type: params.get('service_type') || 'standard',
    tenant_id: params.get('tenant_id') || '',
    weight_kg: params.get('weight_kg') || 2,
    length: '',
    width: '',
    height: '',
    pieces: 1,
    goods_category: params.get('goods_category') || DEFAULT_GOODS,
    description: '',
    declared_value: '',
    payment_mode: 'prepaid',
    payment_method: '',
    payment_method_label: '',
    cod_amount: '',
    merchant_email: '',
    sender_name: '',
    sender_phone: '',
    sender_email: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    receiver_country: params.get('dest_country') || country,
    receiver_city: params.get('dest_city') || 'Yaoundé',
    receiver_address: '',
    receiver_what3words: '',
    notes: '',
  });

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const selected = quotes.find((q) => q.tenant_id === form.tenant_id);
  const methodLabel = (method) =>
    [method.label || railLabel(method.type, lang), method.account_number].filter(Boolean).join(' · ');

  // A signed-in sender is pre-filled so an individual books in a few seconds.
  useEffect(() => {
    base44.auth
      .me()
      .then((user) => {
        if (!user) return;
        setForm((prev) => ({
          ...prev,
          merchant_email: prev.merchant_email || user.email || '',
          sender_name: prev.sender_name || user.full_name || '',
          sender_email: prev.sender_email || user.email || '',
          sender_phone: prev.sender_phone || user.phone || '',
        }));
      })
      .catch(() => null);
  }, []);

  // The chosen logistics partner publishes how it collects money.
  useEffect(() => {
    if (!form.tenant_id) {
      setMethods([]);
      setSelectedMethod(null);
      return;
    }
    let cancelled = false;
    base44.functions
      .invoke('tenantPaymentMethods', { tenant_id: form.tenant_id })
      .then((response) => {
        if (cancelled) return;
        const list = response.data?.methods || [];
        setMethods(list);
        setSelectedMethod(list[0] || null);
        setForm((prev) => ({
          ...prev,
          payment_method: list[0]?.type || '',
          payment_method_label: list[0] ? methodLabel(list[0]) : '',
        }));
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.tenant_id]);

  const chooseMethod = (method) => {
    setSelectedMethod(method);
    setForm((prev) => ({
      ...prev,
      payment_method: method.type,
      payment_method_label: methodLabel(method),
    }));
  };

  const getRates = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await base44.functions.invoke('quoteRate', {
        origin_country: form.origin_country,
        origin_city: form.origin_city,
        dest_country: form.dest_country,
        dest_city: form.dest_city,
        weight_kg: Number(form.weight_kg),
        service_type: form.service_type,
        payment_mode: form.payment_mode,
        cod_amount: Number(form.cod_amount) || 0,
        dimensions: {
          l: Number(form.length) || 0,
          w: Number(form.width) || 0,
          h: Number(form.height) || 0,
        },
      });
      const list = response.data?.quotes || [];
      setQuotes(list);
      if (!list.some((q) => q.tenant_id === form.tenant_id)) {
        setForm((prev) => ({ ...prev, tenant_id: list[0]?.tenant_id || '' }));
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await base44.functions.invoke('createShipment', {
        ...form,
        tenant_id: form.tenant_id,
        weight_kg: Number(form.weight_kg),
        pieces: Number(form.pieces) || 1,
        cod_amount: Number(form.cod_amount) || 0,
        declared_value: Number(form.declared_value) || 0,
        dimensions: {
          l: Number(form.length) || 0,
          w: Number(form.width) || 0,
          h: Number(form.height) || 0,
        },
      });
      setBooked(response.data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyTracking = () => {
    navigator.clipboard?.writeText(booked.tracking_number);
    setCopied(true);
  };

  if (booked) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="rounded-none border border-border bg-card p-8 sm:p-10">
            <span className="grid h-14 w-14 place-items-center rounded-none bg-accent/12 text-accent">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-6 font-heading text-2xl font-semibold text-primary">{t('ship.success')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('ship.successBody')}</p>

            <div className="mt-8 rounded-none bg-primary p-6 text-primary-foreground">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60">{t('ship.tracking')}</p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <span className="font-heading text-2xl font-semibold tracking-tight text-accent">
                  {booked.tracking_number}
                </span>
                <button
                  type="button"
                  onClick={copyTracking}
                  className="flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs transition hover:border-accent"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="mt-5 grid gap-4 border-t border-primary-foreground/12 pt-5 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-primary-foreground/60">{t('ship.waybill')}</p>
                  <p className="mt-1 font-medium">{booked.waybill_number}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60">{t('ship.amount')}</p>
                  <p className="mt-1 font-medium">{formatMoney(booked.total_amount, booked.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60">{t('rate.eta')}</p>
                  <p className="mt-1 font-medium">{booked.eta_date}</p>
                </div>
              </div>
            </div>

            {booked.payment_status === 'awaiting_verification' && selectedMethod && (
              <div className="mt-6 rounded-none border border-border bg-secondary/40 p-6">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <p className="font-heading text-sm font-semibold text-primary">{t('ship.paymentInstructions')}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('ship.paymentPending')}</p>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('ship.paymentMethods')}
                    </dt>
                    <dd className="mt-1 font-medium text-primary">{methodLabel(selectedMethod)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.amount')}</dt>
                    <dd className="mt-1 font-medium text-primary">
                      {formatMoney(booked.total_amount, booked.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('pay.accountName')}</dt>
                    <dd className="mt-1 font-medium text-primary">{selectedMethod.account_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('pay.accountNumber')}
                    </dt>
                    <dd className="mt-1 font-medium text-primary">{selectedMethod.account_number || '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.paymentRef')}</dt>
                    <dd className="mt-1 font-mono font-medium text-primary">{booked.tracking_number}</dd>
                  </div>
                </dl>
                {selectedMethod.instructions && (
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{selectedMethod.instructions}</p>
                )}
              </div>
            )}

            <div className="mt-6 rounded-none border border-accent/40 bg-accent/5 p-5">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-accent" />
                <p className="font-heading text-sm font-semibold text-primary">{t('ship.otpTitle')}</p>
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.35em] text-primary">
                {booked.delivery_otp}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('ship.otpHint')}</p>
            </div>

            {booked.payment_mode === 'cod' && booked.cod_amount > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4 text-accent" />
                {t('track.cod')}: {formatMoney(booked.cod_amount, booked.currency)}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to={`/track?numbers=${booked.tracking_number}`}>
                  {t('ship.trackNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-none"
                onClick={() => {
                  setBooked(null);
                  setStep(0);
                  setQuotes([]);
                }}
              >
                {t('ship.another')}
              </Button>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="border-b border-border bg-secondary/50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('ship.title')}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t('ship.subtitle')}</p>

          <ol className="mt-8 flex flex-wrap gap-3">
            {STEPS.map((key, index) => (
              <li
                key={key}
                className={`flex items-center gap-2 rounded-none px-4 py-2 text-xs font-medium transition ${
                  index === step
                    ? 'bg-primary text-primary-foreground'
                    : index < step
                      ? 'bg-accent/15 text-accent'
                      : 'bg-card text-muted-foreground'
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-none text-[11px] ${
                    index <= step ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                  }`}
                >
                  {index + 1}
                </span>
                {t(key)}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <form
          onSubmit={step === 0 ? getRates : (e) => e.preventDefault()}
          className="rounded-none border border-border bg-card p-7 sm:p-9"
        >
          {step === 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('rate.origin')}</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
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
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('rate.destination')}</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
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
                </div>
              </div>
              <datalist id="zx-cities">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.weight')}</label>
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
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.dims')}</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    <input type="number" placeholder="L" className={inputClass} value={form.length} onChange={update('length')} />
                    <input type="number" placeholder="W" className={inputClass} value={form.width} onChange={update('width')} />
                    <input type="number" placeholder="H" className={inputClass} value={form.height} onChange={update('height')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.pieces')}</label>
                  <input type="number" min="1" className={`mt-1.5 ${inputClass}`} value={form.pieces} onChange={update('pieces')} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('rate.service')}</label>
                  <select className={`mt-1.5 ${inputClass}`} value={form.service_type} onChange={update('service_type')}>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.goods')}</label>
                  <select
                    className={`mt-1.5 ${inputClass}`}
                    value={form.goods_category}
                    onChange={update('goods_category')}
                  >
                    {GOODS_CATEGORIES.map((goods) => (
                      <option key={goods.id} value={goods.id}>
                        {goodsLabel(goods.id, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.description')}</label>
                  <input className={`mt-1.5 ${inputClass}`} value={form.description} onChange={update('description')} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.declaredValue')}</label>
                  <input
                    type="number"
                    className={`mt-1.5 ${inputClass}`}
                    value={form.declared_value}
                    onChange={update('declared_value')}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('ship.payment')}</label>
                  <select className={`mt-1.5 ${inputClass}`} value={form.payment_mode} onChange={update('payment_mode')}>
                    <option value="prepaid">{t('ship.prepaid')}</option>
                    <option value="cod">{t('ship.cod')}</option>
                  </select>
                </div>
                {form.payment_mode === 'cod' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{t('ship.codAmount')}</label>
                    <input
                      type="number"
                      className={`mt-1.5 ${inputClass}`}
                      value={form.cod_amount}
                      onChange={update('cod_amount')}
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="mt-7 w-full rounded-none bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto sm:px-10"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? t('rate.calculating') : t('ship.getRates')}
              </Button>

              {quotes.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('ship.selectPartner')}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {quotes.map((quote) => (
                      <button
                        key={quote.tenant_id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, tenant_id: quote.tenant_id }))}
                        className={`flex w-full items-center justify-between gap-4 rounded-none border px-5 py-4 text-left transition ${
                          form.tenant_id === quote.tenant_id
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <span>
                          <span className="block font-heading text-sm font-semibold text-primary">
                            {quote.tenant_name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {t('rate.days', { days: quote.eta_days })} · {quote.chargeable_weight_kg} kg · {quote.zone_name}
                          </span>
                        </span>
                        <span className="font-heading text-base font-semibold text-primary">
                          {formatMoney(quote.total_amount, quote.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('ship.sender')}
                </h2>
                <div className="mt-4 space-y-4">
                  <input placeholder={t('ship.name')} className={inputClass} value={form.sender_name} onChange={update('sender_name')} />
                  <input placeholder={t('ship.phone')} className={inputClass} value={form.sender_phone} onChange={update('sender_phone')} />
                  <input placeholder={t('ship.email')} className={inputClass} value={form.sender_email} onChange={update('sender_email')} />
                  <input placeholder={t('ship.address')} className={inputClass} value={form.sender_address} onChange={update('sender_address')} />
                  <p className="rounded-none bg-secondary px-3.5 py-2.5 text-xs text-muted-foreground">
                    {[form.origin_city, form.origin_country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('ship.receiver')}
                </h2>
                <div className="mt-4 space-y-4">
                  <input placeholder={t('ship.name')} className={inputClass} value={form.receiver_name} onChange={update('receiver_name')} />
                  <input placeholder={t('ship.phone')} className={inputClass} value={form.receiver_phone} onChange={update('receiver_phone')} />
                  <input placeholder={t('ship.email')} className={inputClass} value={form.receiver_email} onChange={update('receiver_email')} />
                  <input placeholder={t('ship.address')} className={inputClass} value={form.receiver_address} onChange={update('receiver_address')} />
                  <input placeholder={t('ship.what3words')} className={inputClass} value={form.receiver_what3words} onChange={update('receiver_what3words')} />
                  <p className="rounded-none bg-secondary px-3.5 py-2.5 text-xs text-muted-foreground">
                    {[form.dest_city, form.dest_country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ship.selectPartner')}
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-none bg-secondary/60 p-5">
                  <p className="font-heading font-semibold text-primary">{selected?.tenant_name || '—'}</p>
                  <p className="mt-1 text-muted-foreground">
                    {[form.origin_city, form.dest_city].join(' → ')} · {form.pieces} × {form.weight_kg} kg ·{' '}
                    {goodsLabel(form.goods_category, lang)}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-none border border-border p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.sender')}</p>
                    <p className="mt-1 font-medium text-primary">{form.sender_name || '—'}</p>
                    <p className="text-muted-foreground">{form.sender_phone}</p>
                  </div>
                  <div className="rounded-none border border-border p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.receiver')}</p>
                    <p className="mt-1 font-medium text-primary">{form.receiver_name || '—'}</p>
                    <p className="text-muted-foreground">{form.receiver_phone}</p>
                  </div>
                </div>

                <div className="rounded-none border border-border p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.paymentMethods')}</p>
                  {form.payment_mode === 'cod' ? (
                    <p className="mt-2 text-sm text-muted-foreground">{t('ship.paymentCodNote')}</p>
                  ) : methods.length === 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('ship.paymentNone')}</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {methods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => chooseMethod(method)}
                          className={`rounded-none border p-3 text-left transition ${
                            form.payment_method === method.type
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <span className="block text-sm font-medium text-primary">{methodLabel(method)}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {[railLabel(method.type, lang), method.account_name].filter(Boolean).join(' · ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  rows={3}
                  placeholder={t('ship.notes')}
                  className={`resize-none ${inputClass}`}
                  value={form.notes}
                  onChange={update('notes')}
                />

                {selected && (
                  <div className="flex flex-col gap-3 rounded-none bg-primary px-5 py-4 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm">{t('rate.total')}</p>
                      {form.payment_method && form.payment_mode !== 'cod' && (
                        <p className="text-xs text-primary-foreground/70">{form.payment_method_label}</p>
                      )}
                    </div>
                    <span className="font-heading text-xl font-semibold text-accent">
                      {formatMoney(selected.total_amount, selected.currency)}
                    </span>
                  </div>
                )}
                {form.payment_mode === 'cod' && (
                  <p className="text-xs text-muted-foreground">
                    <Banknote className="mr-1.5 inline h-3.5 w-3.5 text-accent" />
                    {t('ship.cod')}: {formatMoney(Number(form.cod_amount) || 0, selected?.currency)}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-5 text-sm text-destructive">{error}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            {step > 0 && (
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setStep((s) => s - 1)}>
                {t('ship.back')}
              </Button>
            )}
            {step === 1 && (
              <Button
                type="button"
                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!form.sender_name || !form.sender_phone || !form.receiver_name || !form.receiver_phone || !form.receiver_address}
                onClick={() => setStep(2)}
              >
                {t('ship.next')}
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                size="lg"
                disabled={submitting || !form.tenant_id}
                className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 sm:px-10"
                onClick={submit}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? t('ship.submitting') : t('ship.submit')}
              </Button>
            )}
            {step === 0 && quotes.length > 0 && (
              <Button
                type="button"
                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!form.tenant_id}
                onClick={() => setStep(1)}
              >
                {t('ship.next')}
              </Button>
            )}
          </div>
        </form>
      </section>
    </SiteShell>
  );
}