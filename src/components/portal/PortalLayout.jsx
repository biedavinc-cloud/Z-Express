import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Package,
  Route,
  Truck,
  Calculator,
  Banknote,
  Warehouse,
  Users,
  Code2,
  CreditCard,
  LogOut,
  Menu,
  X,
  Smartphone,
  Globe,
  ArrowLeft,
  ShieldCheck,
  Store,
  BarChart3,
  Building2,
  ShoppingCart,
  LifeBuoy,
  ClipboardList,
  PackageCheck,
  ScrollText,
  FileText,
  Webhook,
  UserCog,
  Wallet,
} from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession, ROLE_LABELS } from '@/lib/session';
import BrandMark from '@/components/site/BrandMark';
import { Button } from '@/components/ui/button';

const NAV = [
  { key: 'portal.overview', to: '/portal', icon: LayoutDashboard, roles: ['tenant_admin', 'hub_supervisor', 'dispatcher'], end: true },
  { key: 'portal.shipments', to: '/portal/shipments', icon: Package, roles: ['tenant_admin', 'hub_supervisor', 'dispatcher'] },
  { key: 'portal.dispatch', to: '/portal/dispatch', icon: Route, roles: ['tenant_admin', 'hub_supervisor', 'dispatcher'] },
  { key: 'portal.fleet', to: '/portal/fleet', icon: Truck, roles: ['tenant_admin', 'hub_supervisor'] },
  { key: 'portal.pricing', to: '/portal/pricing', icon: Calculator, roles: ['tenant_admin'] },
  { key: 'portal.cod', to: '/portal/cod', icon: Banknote, roles: ['tenant_admin', 'dispatcher'] },
  { key: 'portal.hubs', to: '/portal/hubs', icon: Warehouse, roles: ['tenant_admin', 'hub_supervisor'] },
  { key: 'portal.team', to: '/portal/team', icon: Users, roles: ['tenant_admin'] },
  { key: 'portal.api', to: '/portal/api', icon: Code2, roles: ['tenant_admin'] },
  { key: 'portal.marketplaces', to: '/portal/marketplaces', icon: Store, roles: ['tenant_admin'] },
  { key: 'portal.analytics', to: '/portal/analytics', icon: BarChart3, roles: ['tenant_admin', 'hub_supervisor'] },
  { key: 'portal.merchants', to: '/portal/merchants', icon: ShoppingCart, roles: ['tenant_admin'] },
  { key: 'portal.tickets', to: '/portal/tickets', icon: LifeBuoy, roles: ['tenant_admin', 'dispatcher'] },
  { key: 'portal.settings', to: '/portal/settings', icon: Building2, roles: ['tenant_admin'] },
  { key: 'portal.subscription', to: '/portal/subscription', icon: CreditCard, roles: ['tenant_admin', 'billing_manager'] },
  { key: 'portal.payments', to: '/portal/payments', icon: Wallet, roles: ['tenant_admin', 'billing_manager'] },
  { key: 'portal.shipmentOverview', to: '/shipment-overview', icon: ClipboardList, roles: ['tenant_admin', 'hub_supervisor', 'dispatcher'] },
  { key: 'portal.pod', to: '/proof-of-delivery', icon: PackageCheck, roles: ['tenant_admin', 'hub_supervisor', 'dispatcher'] },
  { key: 'portal.activity', to: '/activity-logs', icon: ScrollText, roles: ['tenant_admin'] },
  { key: 'portal.invoices', to: '/billing/invoices', icon: FileText, roles: ['tenant_admin', 'billing_manager'] },
  { key: 'portal.webhooks', to: '/portal/webhooks', icon: Webhook, roles: ['tenant_admin'] },
  { key: 'portal.permissions', to: '/portal/permissions', icon: UserCog, roles: ['tenant_admin'] },
];

export default function PortalLayout() {
  const { t, lang, setLang, languages } = useI18n();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    resolveSession().then(setSession);
  }, []);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-accent" />
      </div>
    );
  }

  const role = session.role;

  if (role === 'merchant') return <Navigate to="/my-shipments" replace />;
  if (role === 'driver') return <Navigate to="/driver" replace />;

  if (!session.tenant && session.isSuperAdmin) return <Navigate to="/admin" replace />;

  if (!session.tenant) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-9 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
            <Truck className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-heading text-xl font-semibold text-primary">{t('portal.noAccess')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('portal.noAccessBody')}</p>
          <div className="mt-7 flex flex-col gap-2">
            <Button asChild className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/portal/onboarding">{t('portal.applyCta')}</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/">{t('portal.backToSite')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = NAV.filter((item) => role === 'super_admin' || item.roles.includes(role));

  const logout = async () => {
    await base44.auth.logout();
    navigate('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <Link to="/" onClick={() => setOpen(false)}>
          <BrandMark variant="light" />
        </Link>
        <p className="mt-4 truncate text-xs uppercase tracking-wider text-sidebar-foreground/50">
          {session.tenant?.name || t('portal.adminConsole')}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 zx-scrollbar-none">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon style={{ width: 18, height: 18 }} />
              {t(item.key)}
            </NavLink>
          );
        })}

        <div className="my-3 border-t border-sidebar-border" />

        <NavLink
          to="/driver"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent"
        >
          <Smartphone style={{ width: 18, height: 18 }} />
          {t('portal.driverApp')}
        </NavLink>
        {session.isSuperAdmin && (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent"
          >
            <ShieldCheck style={{ width: 18, height: 18 }} />
            {t('portal.adminConsole')}
          </Link>
        )}
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent"
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
          {t('portal.backToSite')}
        </Link>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {(session.user?.full_name || '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {session.user?.full_name}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/50">{ROLE_LABELS[role] || role}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut style={{ width: 18, height: 18 }} />
          {t('portal.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-primary/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-sidebar">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-sidebar-foreground/70"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="zx-safe-top sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('portal.workspace')}</p>
              <p className="font-heading text-sm font-semibold text-primary">
                {session.tenant?.name || t('portal.adminConsole')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Globe className="h-3.5 w-3.5" />
            </span>
            {languages.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition ${
                  lang === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet context={{ session, tenant: session.tenant, role, t, lang }} />
        </main>
      </div>
    </div>
  );
}