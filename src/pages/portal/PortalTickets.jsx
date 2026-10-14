import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, LifeBuoy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scopeFor } from '@/lib/session';
import { formatDate } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const CATEGORIES = ['lost', 'damaged', 'delay', 'ndr', 'billing', 'other'];
const PRIORITIES = ['low', 'normal', 'high'];
const FILTERS = ['open', 'in_progress', 'resolved', 'all'];

const STATUS_CLASS = {
  open: 'bg-accent/15 text-accent',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-destructive/10 text-destructive',
};

const PRIORITY_CLASS = {
  high: 'bg-destructive/10 text-destructive',
  normal: 'bg-secondary text-muted-foreground',
  low: 'bg-secondary text-muted-foreground',
};

const emptyTicket = {
  subject: '',
  category: 'lost',
  priority: 'normal',
  tracking_number: '',
  merchant_email: '',
  details: '',
};

export default function PortalTickets() {
  const { tenant, t, session } = useOutletContext();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(emptyTicket);
  const [notes, setNotes] = useState({});

  const load = async () => {
    const query = { tenant_id: tenant.id };
    if (filter !== 'all') query.status = filter;
    const page = await base44.entities.SupportTicket.filter(query, { sort: '-opened_at', limit: 50 });
    setTickets(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id, filter]);

  const create = async () => {
    if (!form.subject) return;
    setBusy(true);
    const shipment = form.tracking_number
      ? await base44.entities.Shipment.filter({
          tenant_id: tenant.id,
          tracking_number: form.tracking_number.trim().toUpperCase(),
        })
      : [];
    const match = shipment.items?.[0] || shipment[0];
    await base44.entities.SupportTicket.create({
      ...form,
      tracking_number: form.tracking_number.trim().toUpperCase(),
      shipment_id: match?.id || '',
      merchant_email: form.merchant_email || match?.merchant_email || '',
      status: 'open',
      opened_at: new Date().toISOString(),
      ...scopeFor(tenant, session?.user?.email),
    });
    setForm(emptyTicket);
    setShow(false);
    setBusy(false);
    setFilter('open');
    load();
  };

  const updateStatus = async (ticket, status) => {
    await base44.entities.SupportTicket.update(ticket.id, {
      status,
      resolution: notes[ticket.id] || ticket.resolution || '',
      resolved_at: status === 'resolved' || status === 'rejected' ? new Date().toISOString() : '',
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('tickets.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('tickets.subtitle')}</p>
        </div>
        <Button onClick={() => setShow(true)} className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('tickets.new')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {key === 'all' ? t('common.all') : t(`tickets.status.${key}`)}
          </button>
        ))}
      </div>

      {show && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              placeholder={t('tickets.subject')}
              className={`${inputClass} sm:col-span-3`}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`tickets.cat.${cat}`)}
                </option>
              ))}
            </select>
            <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((prio) => (
                <option key={prio} value={prio}>
                  {t(`tickets.prio.${prio}`)}
                </option>
              ))}
            </select>
            <input
              placeholder={t('tickets.tracking')}
              className={`font-mono ${inputClass}`}
              value={form.tracking_number}
              onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
            />
            <input
              placeholder={t('tickets.merchant')}
              className={inputClass}
              value={form.merchant_email}
              onChange={(e) => setForm({ ...form, merchant_email: e.target.value })}
            />
            <textarea
              rows={3}
              placeholder={t('tickets.details')}
              className={`${inputClass} sm:col-span-2`}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={create} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShow(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.length === 0 && (
            <p className="rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t('tickets.none')}
            </p>
          )}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <LifeBuoy className="h-4 w-4 text-accent" />
                    <p className="font-heading text-base font-semibold text-primary">{ticket.subject}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[ticket.status] || STATUS_CLASS.open}`}>
                      {t(`tickets.status.${ticket.status}`)}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${PRIORITY_CLASS[ticket.priority] || PRIORITY_CLASS.normal}`}>
                      {t(`tickets.prio.${ticket.priority}`)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t(`tickets.cat.${ticket.category}`)}
                    {ticket.tracking_number ? ` · ${ticket.tracking_number}` : ''}
                    {ticket.merchant_email ? ` · ${ticket.merchant_email}` : ''} · {t('tickets.opened')}{' '}
                    {formatDate(ticket.opened_at)}
                  </p>
                  {ticket.details && <p className="mt-3 text-sm leading-relaxed text-primary/80">{ticket.details}</p>}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
                <input
                  placeholder={t('tickets.resolution')}
                  className={inputClass}
                  value={notes[ticket.id] ?? ticket.resolution ?? ''}
                  onChange={(e) => setNotes({ ...notes, [ticket.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(ticket, 'in_progress')}
                    className="flex-1 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-primary transition hover:bg-secondary/70"
                  >
                    {t('tickets.status.in_progress')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(ticket, 'resolved')}
                    className="flex-1 rounded-full bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800"
                  >
                    {t('tickets.status.resolved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(ticket, 'rejected')}
                    className="flex-1 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-destructive"
                  >
                    {t('tickets.status.rejected')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}