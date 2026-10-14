import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import BrandMark from '@/components/site/BrandMark';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession } from '@/lib/session';
import AdminOverview from '@/components/admin/AdminOverview';
import CompanyDetail from '@/components/admin/CompanyDetail';
import CompanyTable from '@/components/admin/CompanyTable';
import PlatformRoles from '@/components/admin/PlatformRoles';
import PlatformStaff from '@/components/admin/PlatformStaff';
import SubscriptionBoard from '@/components/admin/SubscriptionBoard';

// Console modules a custom platform role can grant.
const MODULES = ['companies', 'subscriptions', 'invoices', 'staff'];

const EMPTY_STATS = {
  active: 0,
  delivered: 0,
  mrr: 0,
  collected: 0,
  byCountry: [],
  staff: {},
  shipmentsByTenant: {},
  pendingInvoices: 0,
};

export default function AdminConsole() {
  const { t, lang, setLang } = useI18n();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tenants, setTenants] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [roles, setRoles] = useState([]);
  const [openTenantId, setOpenTenantId] = useState('');
  const [companyQuery, setCompanyQuery] = useState({ status: 'all', search: '' });
  const [companyResults, setCompanyResults] = useState(null);

  // Aggregated reads carry the tightest limit on the platform, so a visit spends
  // four of them and everything else is derived from those rows. A privileged
  // action only re-reads the lists, unless it moved one of the counters.
  const load = useCallback(async ({ refreshStats = true } = {}) => {
    const [tenantPage, subPage, invoicePage, userRows, rolePage] = await Promise.all([
      base44.entities.Tenant.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.Subscription.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.Invoice.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.User.list(),
      base44.entities.PlatformRole.filter({}, { sort: 'name', limit: 50 }),
    ]);

    const subs = subPage.items || [];
    const invoiceList = invoicePage.items || [];
    setTenants(tenantPage.items || []);
    setSubscriptions(subs);
    setInvoices(invoiceList);
    setUsers(Array.isArray(userRows) ? userRows : userRows?.items || []);
    setRoles(rolePage.items || []);

    const listStats = {
      mrr: subs.filter((sub) => sub.status === 'active').reduce((total, sub) => total + (sub.amount || 0), 0),
      pendingInvoices: invoiceList.filter((invoice) => invoice.status === 'pending').length,
    };

    if (!refreshStats) {
      setStats((prev) => ({ ...prev, ...listStats }));
      return;
    }

    const [statusRows, countryRows, staffRows, volumeRows, invoiceRows] = await Promise.all([
      base44.entities.Shipment.aggregate({ groupBy: 'status' }),
      base44.entities.Shipment.aggregate({ groupBy: 'receiver_country', limit: 10 }),
      base44.entities.TeamMember.aggregate({ groupBy: 'tenant_id' }),
      base44.entities.Shipment.aggregate({ groupBy: 'tenant_id' }),
      base44.entities.Invoice.aggregate({ groupBy: 'status', sum: 'amount' }),
    ]);

    const rows = statusRows?.rows || [];
    setStats({
      ...listStats,
      active: rows
        .filter((row) => ['created', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery'].includes(row.status))
        .reduce((total, row) => total + row.count, 0),
      delivered: rows.find((row) => row.status === 'delivered')?.count || 0,
      collected: (invoiceRows?.rows || []).find((row) => row.status === 'paid')?.sum_amount || 0,
      byCountry: countryRows?.rows || [],
      staff: Object.fromEntries((staffRows?.rows || []).map((row) => [row.tenant_id, row.count])),
      shipmentsByTenant: Object.fromEntries((volumeRows?.rows || []).map((row) => [row.tenant_id, row.count])),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then(async (resolved) => {
      if (cancelled) return;
      setSession(resolved);
      if (!resolved.user || !resolved.isSuperAdmin) {
        setLoading(false);
        return;
      }
      await load();
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Every privileged change goes through the platform-admin function, which
  // re-checks the caller's role server-side before touching a record.
  const call = async (payload, successKey, closeTab) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await base44.functions.invoke('platformAdmin', payload);
      if (response.data?.error) throw new Error(response.data.error);
      setNotice(successKey ? t(successKey) : '');
      if (closeTab) setTab(closeTab);
      // Only invoice actions move an aggregated counter (collected / pending).
      await load({ refreshStats: String(payload.action || '').startsWith('invoice') });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  // The company directory is filtered by the database rather than on the loaded
  // page: a chip or a search term becomes a new query, and clearing both falls
  // back to the full list already in state.
  const filterCompanies = async (next) => {
    setCompanyQuery(next);
    setOpenTenantId('');
    const query = {};
    if (next.status !== 'all') query.status = next.status;
    const term = next.search.trim();
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { city: { $regex: term, $options: 'i' } },
        { owner_email: { $regex: term, $options: 'i' } },
      ];
    }
    if (!Object.keys(query).length) {
      setCompanyResults(null);
      return;
    }
    setBusy(true);
    try {
      const page = await base44.entities.Tenant.filter(query, { sort: '-created_date', limit: 100 });
      setCompanyResults(page.items || []);
    } finally {
      setBusy(false);
    }
  };

  const visibleTenants = companyResults ?? tenants;
  const openTenant = openTenantId
    ? visibleTenants.find((tenant) => tenant.id === openTenantId) ||
      tenants.find((tenant) => tenant.id === openTenantId)
    : null;

  // An account with no platform role is a platform owner; anyone else sees and
  // runs only what their assigned role grants — the backend checks the same list.
  const me = users.find((member) => member.email === session?.user?.email);
  const myRole = me?.platform_role ? roles.find((role) => role.id === me.platform_role) : null;
  const myPermissions = me && me.platform_role ? myRole?.permissions || [] : MODULES;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // Defence in depth: the route is authenticated, the console redirects anyone
  // without the platform-admin role, and the backend refuses them regardless.
  if (!session?.isSuperAdmin) return <Navigate to="/" replace />;

  const tabs = [
    { id: 'overview', label: t('admin.tabOverview'), icon: LayoutDashboard },
    ...(myPermissions.includes('companies')
      ? [{ id: 'companies', label: t('admin.tabCompanies'), icon: Building2 }]
      : []),
    ...(myPermissions.includes('staff')
      ? [
          { id: 'staff', label: t('admin.tabStaff'), icon: Users },
          { id: 'roles', label: t('admin.tabRoles'), icon: ShieldCheck },
        ]
      : []),
    ...(myPermissions.includes('subscriptions') || myPermissions.includes('invoices')
      ? [{ id: 'subscriptions', label: t('admin.tabSubscriptions'), icon: CreditCard }]
      : []),
  ];
  const activeTab = tabs.some((item) => item.id === tab) ? tab : 'overview';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <BrandMark variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs uppercase tracking-wider text-primary-foreground/60 sm:block">
              {t('portal.adminConsole')}
            </span>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="rounded-full border border-primary-foreground/20 px-3 py-1 text-xs uppercase text-accent"
            >
              {lang}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('admin.title')}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t('admin.health')}: {t('admin.healthOk')} · {session.user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {notice && (
          <p className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </p>
        )}
        {error && (
          <p className="flex items-center gap-2 rounded-none border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}

        {activeTab === 'overview' && (
          <AdminOverview
            stats={stats}
            tenants={tenants}
            invoices={invoices}
            canOpen={myPermissions.includes('companies')}
            onOpenCompany={(tenantId) => {
              setTab('companies');
              setOpenTenantId(tenantId);
            }}
          />
        )}

        {activeTab === 'companies' &&
          (openTenant ? (
            <CompanyDetail
              tenant={openTenant}
              subscription={subscriptions.find((sub) => sub.tenant_id === openTenant.id)}
              staffCount={stats.staff[openTenant.id]}
              shipmentCount={stats.shipmentsByTenant[openTenant.id]}
              busy={busy}
              onBack={() => setOpenTenantId('')}
              onStatus={(tenant, status) =>
                call({ action: 'company_status', tenant_id: tenant.id, status }, 'admin.statusUpdated')
              }
              onPlan={(tenant, plan) =>
                call({ action: 'company_plan', tenant_id: tenant.id, plan }, 'admin.planUpdated')
              }
              onDocument={(tenant, document, status, note) =>
                call(
                  {
                    action: 'document_status',
                    tenant_id: tenant.id,
                    document_id: document.id,
                    status,
                    note,
                  },
                  status === 'verified' ? 'admin.docVerified' : 'admin.docRejected'
                )
              }
            />
          ) : (
            <CompanyTable
              tenants={visibleTenants}
              staffCounts={stats.staff}
              shipmentCounts={stats.shipmentsByTenant}
              subscriptions={subscriptions}
              busy={busy}
              query={companyQuery}
              onFilter={filterCompanies}
              onOpen={setOpenTenantId}
              onStatus={(tenant, status) =>
                call({ action: 'company_status', tenant_id: tenant.id, status }, 'admin.statusUpdated')
              }
              onPlan={(tenant, plan) =>
                call({ action: 'company_plan', tenant_id: tenant.id, plan }, 'admin.planUpdated')
              }
            />
          ))}

        {activeTab === 'staff' && (
          <PlatformStaff
            users={users}
            roles={roles}
            busy={busy}
            onInvite={(email, role) =>
              call({ action: 'staff_invite', email, role }, 'admin.invited')
            }
            onRole={(member, role) =>
              call({ action: 'staff_role', user_id: member.id, role }, 'admin.roleUpdated')
            }
            onPlatformRole={(member, roleId) =>
              call(
                { action: 'staff_role', user_id: member.id, platform_role: roleId },
                'admin.roleUpdated'
              )
            }
          />
        )}

        {activeTab === 'roles' && (
          <PlatformRoles
            roles={roles}
            users={users}
            busy={busy}
            onSave={(draft) =>
              call(
                {
                  action: 'role_save',
                  role_id: draft.id || '',
                  name: draft.name.trim(),
                  description: draft.description,
                  permissions: draft.permissions,
                },
                'admin.roleSaved'
              )
            }
            onDelete={(role) => call({ action: 'role_delete', role_id: role.id }, 'admin.roleDeleted')}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionBoard
            subscriptions={subscriptions}
            invoices={invoices}
            busy={busy}
            onSave={(sub, patch) =>
              call(
                {
                  action: 'subscription_save',
                  subscription_id: sub.id,
                  plan: patch.plan || sub.plan,
                  billing_cycle: patch.billing_cycle || sub.billing_cycle,
                  status: patch.status || sub.status,
                },
                'admin.subUpdated'
              )
            }
            onIssue={(sub) =>
              call(
                { action: 'invoice_create', subscription_id: sub.id },
                'admin.invoiceIssued'
              )
            }
            onPaid={(invoice) => call({ action: 'invoice_paid', invoice_id: invoice.id }, 'admin.paid')}
          />
        )}

        <Link to="/portal" className="inline-block text-sm font-medium text-accent">
          {t('biz.ctaLogin')} →
        </Link>
      </main>
    </div>
  );
}