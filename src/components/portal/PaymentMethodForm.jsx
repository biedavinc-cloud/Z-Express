import React, { useState } from 'react';
import { api } from '@/api/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PAYMENT_RAILS, PAYMENT_RAIL_KINDS, DEFAULT_RAIL, railLabel } from '@/lib/payments';
import { scopeForEntity } from '@/lib/session';

const inputClass =
  'mt-1.5 w-full rounded-none border border-input bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

export default function PaymentMethodForm({ tenant, method, lang, t, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type: method?.type || DEFAULT_RAIL,
    label: method?.label || '',
    account_name: method?.account_name || '',
    account_number: method?.account_number || '',
    bank_name: method?.bank_name || '',
    country: method?.country || tenant.country || '',
    currency: method?.currency || tenant.currency || 'XAF',
    instructions: method?.instructions || '',
    active: method?.active !== false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const save = async () => {
    setError('');
    if (!form.account_number.trim() && !form.account_name.trim()) {
      setError(t('pay.needAccount'));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        label: form.label.trim() || railLabel(form.type, lang),
        member_emails: (await scopeForEntity(tenant, 'PaymentMethod')).member_emails,
      };
      if (method) await api.entities.PaymentMethod.update(method.id, payload);
      else await api.entities.PaymentMethod.create({ ...payload, sort_order: Date.now() % 100000 });
      onSaved();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-none border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.rail')}</span>
          <select className={inputClass} value={form.type} onChange={update('type')}>
            {PAYMENT_RAIL_KINDS.map((kind) => (
              <optgroup key={kind.id} label={kind[lang] || kind.en}>
                {PAYMENT_RAILS.filter((rail) => rail.kind === kind.id).map((rail) => (
                  <option key={rail.id} value={rail.id}>
                    {railLabel(rail.id, lang)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.label')}</span>
          <input className={inputClass} placeholder={t('pay.labelHint')} value={form.label} onChange={update('label')} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.accountName')}</span>
          <input className={inputClass} value={form.account_name} onChange={update('account_name')} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.accountNumber')}</span>
          <input className={inputClass} value={form.account_number} onChange={update('account_number')} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.bank')}</span>
          <input className={inputClass} value={form.bank_name} onChange={update('bank_name')} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{t('pay.country')}</span>
            <input className={inputClass} value={form.country} onChange={update('country')} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{t('pay.currency')}</span>
            <input className={inputClass} value={form.currency} onChange={update('currency')} />
          </label>
        </div>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">{t('pay.instructions')}</span>
          <textarea
            rows={2}
            className={`resize-none ${inputClass}`}
            value={form.instructions}
            onChange={update('instructions')}
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? t('pay.saving') : t('pay.save')}
        </Button>
        <Button type="button" variant="ghost" className="rounded-none" onClick={onCancel}>
          {t('ship.back')}
        </Button>
      </div>
    </div>
  );
}