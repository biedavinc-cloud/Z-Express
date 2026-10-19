import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { ArrowLeft, ArrowRight, Loader2, LogOut, Package, Search } from 'lucide-react';
import BrandMark from '@/components/site/BrandMark';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession } from '@/lib/session';
import { formatMoney, formatDate, SHIPMENT_STATUS_CLASS } from '@/lib/logistics';
import { PAYMENT_STATUS_CLASS, paymentStatusLabel } from '@/lib/payments';

export default function MerchantHome() {
  const { t, lang, setLang } = useI18n();
  const [session, setSession] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then(async (resolved) => {
      if (cancelled) return;
      setSession(resolved);
      if (!resolved.user) {
        setLoading(false);
        return;
      }
      const page = await api.entities.Shipment.filter(
        { $or: [{ merchant_email: resolved.user.email }, { sender_email: resolved.user.email }] },
        { sort: '-created_date', limit: 50 }
      );
      if (cancelled) return;
      setShipments(page.items || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!session?.user) return <Navigate to="/login" replace />;
  if (session.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (['tenant_admin', 'hub_supervisor', 'dispatcher', 'driver'].includes(session.role)) {
    return <Navigate to="/portal" replace />;
  }

  // An individual sender keeps a free space: no subscription, pay per parcel.
  const isIndividual = session.user.account_type === 'individual';
  const logout = async () => {
    await api.auth.logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="zx-safe-top border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <BrandMark variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-foreground/60 sm:block">{session.user.email}</span>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="rounded-full border border-primary-foreground/20 px-3 py-1 text-xs uppercase text-accent"
            >
              {lang}
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label={t('portal.logout')}
              className="grid h-8 w-8 place-items-center rounded-full border border-primary-foreground/20 text-primary-foreground/70 transition hover:text-accent"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('portal.backToSite')}
        </Link>

        <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-primary">
          {isIndividual ? t('me.title') : t('merchant.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isIndividual ? t('me.subtitle') : t('merchant.subtitle')}
        </p>

        {isIndividual && (
          <div className="mt-6 rounded-none border border-border bg-card p-8">
            <p className="inline-flex border border-accent/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {t('me.freeTitle')}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('me.freeBody')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/send">
                  {t('me.send')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-none">
                <Link to="/track">
                  <Search className="mr-2 h-4 w-4" />
                  {t('me.track')}
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('me.externalHint')}</p>
          </div>
        )}

        <h2 className="mt-10 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('me.parcels')}
        </h2>

        <div className="mt-4 space-y-3">
          {shipments.length === 0 && (
            <div className="rounded-none border border-dashed border-border bg-card px-6 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-none bg-secondary text-muted-foreground">
                <Package className="h-7 w-7" />
              </span>
              <p className="mt-5 text-sm text-muted-foreground">
                {isIndividual ? t('me.none') : t('merchant.none')}
              </p>
              <Link to="/send" className="mt-5 inline-block text-sm font-medium text-accent">
                {t('ship.title')} →
              </Link>
            </div>
          )}
          {shipments.map((shipment) => (
            <Link
              key={shipment.id}
              to={`/track?numbers=${shipment.tracking_number}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-border bg-card px-6 py-4 transition hover:border-accent/50"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">{shipment.tracking_number}</p>
                <p className="mt-1 font-medium text-primary">
                  {shipment.sender_city} → {shipment.receiver_city}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {shipment.receiver_name} · {formatDate(shipment.created_date, false)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-heading text-sm font-semibold text-primary">
                  {formatMoney(shipment.total_amount, shipment.currency)}
                </span>
                {shipment.payment_status && (
                  <span
                    className={`rounded-none px-2.5 py-1 text-[11px] font-semibold ${
                      PAYMENT_STATUS_CLASS[shipment.payment_status] || PAYMENT_STATUS_CLASS.unpaid
                    }`}
                  >
                    {paymentStatusLabel(shipment.payment_status, lang)}
                  </span>
                )}
                <span
                  className={`rounded-none px-2.5 py-1 text-[11px] font-semibold ${
                    SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
                  }`}
                >
                  {t(`status.${shipment.status}`)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}