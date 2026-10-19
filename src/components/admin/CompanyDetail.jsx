import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import {
  ArrowLeft,
  Ban,
  Building2,
  FileText,
  Loader2,
  Palette,
  Play,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate, formatMoney } from '@/lib/logistics';
import { docKindKey, docStatusClass, kycClass, kycKey } from '@/lib/documents';

const PLAN_IDS = ['starter', 'pro', 'enterprise'];

const Rows = ({ rows }) => (
  <dl className="mt-4 divide-y divide-border">
    {rows
      .filter(([, value]) => value)
      .map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="shrink-0 text-muted-foreground">{label}</dt>
          <dd className="text-right text-primary">{value}</dd>
        </div>
      ))}
  </dl>
);

export default function CompanyDetail({
  tenant,
  subscription,
  staffCount,
  shipmentCount,
  busy,
  onBack,
  onStatus,
  onPlan,
  onDocument,
}) {
  const { t } = useI18n();
  const [team, setTeam] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [opening, setOpening] = useState('');
  const [docError, setDocError] = useState('');
  const [rejecting, setRejecting] = useState('');
  const [reason, setReason] = useState('');

  // The company team and its invoices are only pulled once the file is opened,
  // so browsing the directory stays a single cheap read.
  useEffect(() => {
    let cancelled = false;
    setTeam(null);
    setInvoices(null);
    Promise.all([
      api.entities.TeamMember.filter({ tenant_id: tenant.id }, { sort: 'full_name', limit: 50 }),
      api.entities.Invoice.filter({ tenant_id: tenant.id }, { sort: '-issued_at', limit: 20 }),
    ]).then(([teamPage, invoicePage]) => {
      if (cancelled) return;
      setTeam(teamPage.items || []);
      setInvoices(invoicePage.items || []);
    });
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  const documents = tenant.documents || [];

  const openDocument = async (document) => {
    setOpening(document.id);
    setDocError('');
    try {
      const { signed_url } = await api.integrations.Core.CreateFileSignedUrl({
        file_uri: document.file_uri,
      });
      window.open(signed_url, '_blank', 'noopener');
    } catch (err) {
      setDocError(err.message || t('admin.openDocError'));
    } finally {
      setOpening('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border border-border bg-card p-6">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('admin.closeFile')}
          </button>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-primary">{tenant.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {[tenant.city, tenant.country].filter(Boolean).join(', ')} · {tenant.owner_email}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                tenant.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : tenant.status === 'pending'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-destructive/10 text-destructive'
              }`}
            >
              {tenant.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kycClass(tenant.kyc_status)}`}>
              {t(kycKey(tenant.kyc_status))}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tenant.plan || 'starter'}
            disabled={busy}
            onChange={(event) => onPlan(tenant, event.target.value)}
            className="h-9 border border-input bg-card px-2.5 text-xs capitalize outline-none focus:border-accent"
          >
            {PLAN_IDS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
          {tenant.status !== 'active' ? (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onStatus(tenant, 'active')}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {t('admin.activate')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(tenant, 'suspended')}>
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              {t('admin.suspend')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {t('admin.identity')}
          </h3>
          <Rows
            rows={[
              [t('common.name'), tenant.name],
              [t('settings.legalName'), tenant.legal_name],
              [t('onboard.website'), tenant.website],
              [t('settings.trackingPrefix'), tenant.tracking_prefix],
              [t('admin.contact'), [tenant.email, tenant.phone].filter(Boolean).join(' · ')],
              [t('common.address'), [tenant.address, tenant.city, tenant.country].filter(Boolean).join(', ')],
              [t('settings.about'), tenant.about],
            ]}
          />
        </div>

        <div className="border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-4 w-4" />
            {t('admin.team')}
          </h3>
          <Rows
            rows={[
              [t('admin.staffCount'), String(staffCount || 0)],
              [t('admin.shipments'), String(shipmentCount || 0)],
              [
                t('admin.subscription'),
                subscription
                  ? `${subscription.plan} · ${t(`sub.status.${subscription.status}`)} · ${formatMoney(
                      subscription.amount,
                      subscription.currency
                    )}`
                  : t('common.noData'),
              ],
            ]}
          />
          {team === null && <Loader2 className="mt-4 h-4 w-4 animate-spin text-accent" />}
          {team !== null && team.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">{t('admin.noStaff')}</p>
          )}
          {team !== null && team.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {team.map((member) => (
                <li key={member.id} className="border border-border bg-secondary/30 px-4 py-3">
                  <p className="text-sm font-medium text-primary">{member.full_name || member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-accent">
                    {member.role.replace('_', ' ')} · {member.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" />
            {t('admin.docs')}
          </h3>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kycClass(tenant.kyc_status)}`}>
            {t(kycKey(tenant.kyc_status))}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('admin.docsBody')}</p>

        {docError && <p className="mt-3 text-sm text-destructive">{docError}</p>}

        {documents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('admin.noDocs')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((document) => (
              <li key={document.id} className="border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-primary">
                      <FileText className="h-4 w-4 shrink-0 text-accent" />
                      {document.label || document.file_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(docKindKey(document.kind))} · {formatDate(document.uploaded_at, false)}
                      {document.file_name ? ` · ${document.file_name}` : ''}
                    </p>
                    {document.note && (
                      <p className="mt-1 text-xs text-destructive">
                        {t('admin.notes')}: {document.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold ${docStatusClass(document.status)}`}>
                      {t(`doc.status.${document.status || 'pending'}`)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!document.file_uri || opening === document.id}
                      onClick={() => openDocument(document)}
                    >
                      {opening === document.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      {t('admin.openDoc')}
                    </Button>
                    {document.status !== 'verified' && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => onDocument(tenant, document, 'verified')}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        {t('admin.verify')}
                      </Button>
                    )}
                    {document.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setRejecting(document.id);
                          setReason('');
                        }}
                      >
                        {t('admin.reject')}
                      </Button>
                    )}
                  </div>
                </div>

                {rejecting === document.id && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={t('admin.rejectNote')}
                      className="h-10 flex-1 border border-input bg-card px-3 text-sm outline-none focus:border-accent"
                    />
                    <Button size="sm" variant="outline" onClick={() => setRejecting('')}>
                      {t('admin.roleCancel')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        onDocument(tenant, document, 'rejected', reason);
                        setRejecting('');
                      }}
                    >
                      {t('admin.rejectConfirm')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Receipt className="h-4 w-4" />
            {t('admin.companyInvoices')}
          </h3>
          {invoices === null && <Loader2 className="mt-4 h-4 w-4 animate-spin text-accent" />}
          {invoices !== null && invoices.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">{t('admin.noCompanyInvoices')}</p>
          )}
          {invoices !== null && invoices.length > 0 && (
            <div className="mt-4 divide-y divide-border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.status} · {formatDate(invoice.issued_at, false)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatMoney(invoice.amount, invoice.currency || 'USD')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Palette className="h-4 w-4" />
            {t('admin.branding')}
          </h3>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-border bg-background p-1">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} className="h-full w-full" fittingType="fit" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </span>
            <div className="flex gap-3">
              {[tenant.brand_color, tenant.accent_color].filter(Boolean).map((color) => (
                <span key={color} className="flex items-center gap-2">
                  <span className="h-6 w-6 border border-border" style={{ background: color }} />
                  <span className="font-mono text-xs text-muted-foreground">{color}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}