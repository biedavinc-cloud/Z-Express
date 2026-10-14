import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Copy, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scopeForEntity } from '@/lib/session';
import { formatDate } from '@/lib/logistics';
import { APP_DOMAIN } from '@/lib/branding';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

function generateKey(environment) {
  const body = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  return `zx_${environment}_${body}`;
}

export default function PortalApi() {
  const { tenant, t, session } = useOutletContext();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ label: 'My store', environment: 'live', webhook_url: '' });
  const [limits, setLimits] = useState({});
  const [savedLimit, setSavedLimit] = useState('');

  const endpoint = `${APP_DOMAIN}/functions/merchantApi`;

  const load = async () => {
    const list = await base44.entities.ApiKey.filter({ tenant_id: tenant.id }, { sort: '-created_date', limit: 50 });
    setKeys(list.items || list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const createKey = async () => {
    setBusy(true);
    const api_key = generateKey(form.environment);
    await base44.entities.ApiKey.create({
      label: form.label,
      environment: form.environment,
      webhook_url: form.webhook_url,
      api_key,
      key_prefix: api_key.slice(0, 12),
      active: true,
      ...(await scopeForEntity(tenant, 'ApiKey', session?.user?.email)),
    });
    setRevealed({ [api_key]: true });
    setShow(false);
    setBusy(false);
    load();
  };

  const toggleActive = async (key) => {
    await base44.entities.ApiKey.update(key.id, { active: !key.active });
    load();
  };

  const remove = async (key) => {
    await base44.entities.ApiKey.delete(key.id);
    load();
  };

  // The allowance the API itself enforces per key, per minute.
  const saveLimit = async (key) => {
    const parsed = Number(limits[key.id] ?? key.rate_limit_per_min ?? 60);
    const value = Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 10), 1000) : 60;
    setBusy(true);
    await base44.entities.ApiKey.update(key.id, { rate_limit_per_min: value });
    setBusy(false);
    setSavedLimit(key.id);
    load();
  };

  const copy = (value) => {
    navigator.clipboard?.writeText(value);
    setCopied(value);
  };

  const sample = `curl -X POST ${endpoint} \\
  -H "x-api-key: ${keys[0]?.api_key || 'zx_live_xxxx'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create",
    "merchant_ref": "ORDER-10233",
    "source": "api",
    "sender_name": "Your Store",
    "sender_phone": "+237600000000",
    "receiver_name": "Awa N.",
    "receiver_phone": "+237611111111",
    "receiver_city": "Douala",
    "receiver_country": "Cameroon",
    "receiver_address": "Rue 12, Bonapriso",
    "weight_kg": 1.5,
    "payment_mode": "cod",
    "cod_amount": 25000
  }'`;

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('api.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('api.subtitle')}</p>
        </div>
        <Button onClick={() => setShow(true)} className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('api.create')}
        </Button>
      </div>

      {show && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              placeholder={t('api.label')}
              className={inputClass}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <select
              className={inputClass}
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value })}
            >
              <option value="live">{t('api.live')}</option>
              <option value="test">{t('api.test')}</option>
            </select>
            <input
              placeholder={t('api.webhook')}
              className={inputClass}
              value={form.webhook_url}
              onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={createKey} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShow(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {keys.length === 0 && (
          <p className="rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
            {t('api.noKeys')}
          </p>
        )}
        {keys.map((key) => (
          <div key={key.id} className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <KeyRound className="h-4 w-4 text-accent" />
                  <p className="font-heading text-base font-semibold text-primary">{key.label}</p>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t(`api.${key.environment}`)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('api.calls')}: {key.call_count || 0} · {t('api.lastUsed')}: {formatDate(key.last_used_at)} ·{' '}
                  {t('api.rateLimit')}: {key.rate_limit_per_min || 60}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(key)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
                    key.active ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {key.active ? t('common.active') : t('api.revoke')}
                </button>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  className="rounded-full bg-secondary px-3.5 py-1.5 text-[11px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-accent">
                {revealed[key.id] ? key.api_key : `${key.key_prefix}${'•'.repeat(18)}`}
              </code>
              <button
                type="button"
                onClick={() => setRevealed((prev) => ({ ...prev, [key.id]: !prev[key.id] }))}
                className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground/70 transition hover:text-accent"
              >
                {revealed[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => copy(key.api_key)}
                className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground/70 transition hover:text-accent"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === key.api_key && <p className="mt-2 text-xs text-emerald-700">{t('common.copied')}</p>}
            {key.webhook_url && (
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {t('api.webhook')}: {key.webhook_url}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t('api.rateLimit')}
              </span>
              <input
                type="number"
                min="10"
                max="1000"
                value={limits[key.id] ?? key.rate_limit_per_min ?? 60}
                onChange={(e) => setLimits((prev) => ({ ...prev, [key.id]: e.target.value }))}
                className="w-24 rounded-xl border border-input bg-card px-3 py-1.5 text-sm outline-none transition focus:border-accent"
              />
              <Button size="sm" onClick={() => saveLimit(key)} disabled={busy}>
                {t('common.save')}
              </Button>
              <span className="text-[11px] text-muted-foreground">{t('api.rateLimitHint')}</span>
            </div>
            {savedLimit === key.id && <p className="mt-2 text-xs text-emerald-700">{t('api.rateLimitSaved')}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('api.docs')}
        </h2>
        <p className="mt-3 font-mono text-xs text-primary">{endpoint}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['rate', 'create', 'track', 'pod'].map((action) => (
            <span key={action} className="rounded-full bg-secondary px-3 py-1 font-mono text-[11px] text-primary">
              action: {action}
            </span>
          ))}
        </div>
        <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">{t('api.sample')}</p>
        <pre className="mt-3 overflow-x-auto rounded-2xl bg-primary p-4 font-mono text-[11px] leading-relaxed text-primary-foreground">
          {sample}
        </pre>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('dev.marketplaceDesc')}</p>
      </div>
    </div>
  );
}