import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketplaceCard from '@/components/portal/MarketplaceCard';
import MarketplaceForm from '@/components/portal/MarketplaceForm';
import { scopeForEntity } from '@/lib/session';
import { generateInboundToken } from '@/lib/marketplaces';
import { APP_DOMAIN } from '@/lib/branding';

const emptyForm = {
  marketplace: 'shopify',
  label: '',
  mode: 'orders_in',
  default_service_type: 'standard',
  default_payment_mode: 'prepaid',
  webhook_url: '',
  api_base_url: '',
  api_key: '',
  api_secret: '',
};

export default function PortalMarketplaces() {
  const { tenant, t, session } = useOutletContext();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const origin = APP_DOMAIN;

  const load = async () => {
    setError('');
    try {
      const page = await base44.entities.MarketplaceConnection.filter(
        { tenant_id: tenant.id },
        { sort: '-created_date', limit: 50 }
      );
      setConnections(page.items || []);
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      await base44.entities.MarketplaceConnection.create({
        ...form,
        label: form.label || '',
        inbound_token: generateInboundToken(),
        status: 'connected',
        orders_count: 0,
        ...(await scopeForEntity(tenant, 'MarketplaceConnection', session?.user?.email)),
      });
      setForm(emptyForm);
      setShow(false);
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (connection) => {
    setError('');
    try {
      await base44.entities.MarketplaceConnection.update(connection.id, {
        status: connection.status === 'connected' ? 'disabled' : 'connected',
      });
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    }
  };

  const remove = async (connection) => {
    setError('');
    try {
      await base44.entities.MarketplaceConnection.delete(connection.id);
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    }
  };

  const copy = (value) => {
    navigator.clipboard?.writeText(value);
    setCopied(value);
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('mkt.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('mkt.subtitle')}</p>
        </div>
        <Button onClick={() => setShow(true)} className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('mkt.connect')}
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {show && (
        <MarketplaceForm
          form={form}
          setForm={setForm}
          onSubmit={create}
          onCancel={() => setShow(false)}
          busy={busy}
          t={t}
        />
      )}

      <div className="space-y-4">
        {connections.length === 0 && (
          <p className="rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
            {t('mkt.noConnections')}
          </p>
        )}
        {connections.map((connection) => (
          <MarketplaceCard
            key={connection.id}
            connection={connection}
            origin={origin}
            onToggle={toggle}
            onRemove={remove}
            onCopy={copy}
            copied={copied}
            t={t}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-heading text-sm font-semibold text-primary">{t('mkt.carrierTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('mkt.carrierBody')}</p>
        <Button asChild variant="outline" className="mt-4 rounded-2xl">
          <Link to="/portal/api">
            {t('mkt.carrierCta')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-4 text-[11px] text-muted-foreground">{t('mkt.tokenNote')}</p>
      </div>
    </div>
  );
}