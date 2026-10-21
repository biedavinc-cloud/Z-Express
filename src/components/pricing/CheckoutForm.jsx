import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { COUNTRIES, formatDate, formatMoney } from '@/lib/logistics';
import { TRIAL_DAYS, quote } from '@/lib/pricing';

const inputClass =
  'w-full rounded-none border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const COUNTRY_OPTIONS = COUNTRIES.map((country) => (typeof country === 'string' ? country : country?.name)).filter(
  Boolean
);

const trialEndDate = () => new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10);

// The agency confirms its plan and billing details, then we redirect to the hosted
// payment page. The price is resolved again server-side there — the browser
// never sends an amount — and the webhook activates the subscription while the agency pays.
export default function CheckoutForm({ tenant, session, initial = {}, onDone, onClose }) {
  const { t } = useI18n();
  const [planId] = useState(initial.planId || 'pro');
  const [cycle] = useState(initial.cycle || 'monthly');
  const [extraSeats] = useState(initial.extraSeats || 0);
  const [startMode, setStartMode] = useState(initial.startMode || 'trial');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company: tenant?.legal_name || tenant?.name || '',
    contact_name: session?.user?.full_name || '',
    email: session?.user?.email || '',
    phone: tenant?.phone || '',
    country: tenant?.country || COUNTRY_OPTIONS[0] || '',
    city: tenant?.city || '',
    address: tenant?.address || '',
    tax_id: '',
  });

  const priced = quote({ planId, cycle, extraSeats });
  const update = (patch) => setForm((previous) => ({ ...previous, ...patch }));
  const dueDate = trialEndDate();

  const submit = async () => {
    setError('');
    if (!form.company.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setError(t('checkout.required'));
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setError(t('checkout.invalidEmail'));
      return;
    }
    if (!terms) {
      setError(t('checkout.needTerms'));
      return;
    }

    setBusy(true);
    try {
      const response = await api.functions.invoke('create-checkout', {
        productId: planId,
        billing_cycle: cycle,
        start_mode: startMode === 'now' ? 'now' : 'trial',
        extra_seats: extraSeats,
        tenant_id: tenant.id,
        billing: {
          company: form.company,
          contact_name: form.contact_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          tax_id: form.tax_id,
        },
      });
      const result = response?.data || {};
      if (result.error) {
        setError(result.error);
        setBusy(false);
        return;
      }
      // Redirect to the hosted payment page. The webhook activates the
      // subscription while the agency is paying.
      if (!result.redirectUrl) {
        setError(t('checkout.failed'));
        setBusy(false);
        return;
      }
      window.location.href = result.redirectUrl;
    } catch (err) {
      setError(err.message || t('checkout.failed'));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-primary">{t('checkout.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('checkout.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('checkout.companySection')}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.company')}</span>
                <input
                  className={inputClass}
                  value={form.company}
                  onChange={(e) => update({ company: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.contactName')}</span>
                <input
                  className={inputClass}
                  value={form.contact_name}
                  onChange={(e) => update({ contact_name: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.email')}</span>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.phone')}</span>
                <input className={inputClass} value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.country')}</span>
                <select className={inputClass} value={form.country} onChange={(e) => update({ country: e.target.value })}>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.city')}</span>
                <input className={inputClass} value={form.city} onChange={(e) => update({ city: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.address')}</span>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-primary">{t('checkout.taxId')}</span>
                <input
                  className={inputClass}
                  value={form.tax_id}
                  onChange={(e) => update({ tax_id: e.target.value })}
                  placeholder={t('checkout.taxIdHint')}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('checkout.startSection')}
            </h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                {
                  id: 'trial',
                  label: t('checkout.modeTrial'),
                  note: t('checkout.modeTrialNote', { date: formatDate(dueDate, false) }),
                },
                { id: 'now', label: t('checkout.modeNow'), note: t('checkout.modeNowNote') },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStartMode(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    startMode === option.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <span className="block font-heading text-sm font-semibold text-primary">{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{option.note}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col rounded-2xl bg-primary p-6 text-primary-foreground">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/60">
            {t('checkout.summary')}
          </h3>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-primary-foreground/80">{t('checkout.linePlan')}</dt>
              <dd className="font-medium">{t(`biz.plan.${priced.plan.id}`)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-primary-foreground/80">{t('checkout.lineCycle')}</dt>
              <dd className="font-medium">{t(`pricing.${cycle}`)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-primary-foreground/80">{t('checkout.lineSeats')}</dt>
              <dd className="font-medium">{priced.seats}</dd>
            </div>
            {priced.discount > 0 && (
              <div className="flex items-baseline justify-between gap-4 text-emerald-300">
                <dt>{t('calc.lineDiscount')}</dt>
                <dd className="font-medium">−{formatMoney(priced.discount, priced.currency)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 rounded-2xl bg-primary-foreground/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-primary-foreground/60">
              {t('checkout.lineTotal')}
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold text-accent">
              {formatMoney(priced.total, priced.currency)}
            </p>
            <p className="mt-1.5 text-xs text-primary-foreground/75">{t('pricing.noFees')}</p>
            <p className="mt-1 text-xs text-primary-foreground/60">{t('pricing.currencyNote')}</p>
          </div>

          <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-primary-foreground/85">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
            />
            {t('checkout.terms')}
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-destructive/20 px-3.5 py-2.5 text-xs text-primary-foreground">{error}</p>
          )}

          <Button
            onClick={submit}
            disabled={busy}
            className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? t('checkout.redirecting') : t('checkout.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}