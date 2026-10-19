import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Check, Loader2, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentMethodForm from '@/components/portal/PaymentMethodForm';
import { formatMoney, formatDate } from '@/lib/logistics';
import { PAYMENT_STATUS_CLASS, paymentStatusLabel, railLabel } from '@/lib/payments';

export default function PortalPayments() {
  const { tenant, t, lang } = useOutletContext();
  const [methods, setMethods] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [rows, page] = await Promise.all([
      api.entities.PaymentMethod.filter({ tenant_id: tenant.id }, { sort: 'sort_order', limit: 40 }),
      api.entities.Shipment.filter(
        { tenant_id: tenant.id, payment_status: 'awaiting_verification' },
        { sort: '-created_date', limit: 25 }
      ),
    ]);
    setMethods(rows.items || []);
    setPending(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const confirmPaid = async (shipment) => {
    setBusy(true);
    await api.entities.Shipment.update(shipment.id, {
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    });
    setBusy(false);
    load();
  };

  const remove = async (method) => {
    setBusy(true);
    await api.entities.PaymentMethod.delete(method.id);
    setBusy(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('pay.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('pay.subtitle')}</p>
        </div>
        {!form && (
          <Button
            type="button"
            onClick={() => setForm({ method: null })}
            className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('pay.add')}
          </Button>
        )}
      </div>

      {form && (
        <PaymentMethodForm
          tenant={tenant}
          method={form.method}
          lang={lang}
          t={t}
          onSaved={() => {
            setForm(null);
            load();
          }}
          onCancel={() => setForm(null)}
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {methods.length === 0 && !form && (
          <p className="rounded-none border border-dashed border-border bg-card px-6 py-10 text-sm text-muted-foreground lg:col-span-2">
            {t('pay.none')}
          </p>
        )}
        {methods.map((method) => (
          <div key={method.id} className="rounded-none border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-none bg-accent/12 text-accent">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-primary">
                    {method.label || railLabel(method.type, lang)}
                  </p>
                  <p className="text-xs text-muted-foreground">{railLabel(method.type, lang)}</p>
                  <p className="mt-2 text-sm text-primary">
                    {method.account_name || '—'}
                    {method.account_number ? ` · ${method.account_number}` : ''}
                  </p>
                  {method.bank_name && <p className="text-xs text-muted-foreground">{method.bank_name}</p>}
                  {method.instructions && (
                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{method.instructions}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setForm({ method })}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(method)}
                  className="grid h-8 w-8 place-items-center rounded-none border border-border text-muted-foreground transition hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-none border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary">
            {t('pay.pendingTitle')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('pay.pendingBody')}</p>
        </div>
        <div className="divide-y divide-border">
          {pending.length === 0 && (
            <p className="px-6 py-8 text-sm text-muted-foreground">{t('pay.pendingNone')}</p>
          )}
          {pending.map((shipment) => (
            <div key={shipment.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{shipment.tracking_number}</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {shipment.sender_city} → {shipment.receiver_city}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {shipment.payment_method_label || railLabel(shipment.payment_method, lang)} ·{' '}
                  {formatDate(shipment.created_date, false)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading text-sm font-semibold text-primary">
                  {formatMoney(shipment.total_amount, shipment.currency)}
                </span>
                <span
                  className={`rounded-none px-2.5 py-1 text-[11px] font-semibold ${
                    PAYMENT_STATUS_CLASS[shipment.payment_status] || PAYMENT_STATUS_CLASS.unpaid
                  }`}
                >
                  {paymentStatusLabel(shipment.payment_status, lang)}
                </span>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => confirmPaid(shipment)}
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t('pay.markPaid')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}