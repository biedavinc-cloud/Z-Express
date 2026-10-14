import React, { useEffect, useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Printer, Loader2, Plus, ImageIcon, PenLine, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney, formatDate, SHIPMENT_STATUS_CLASS, SHIPMENT_STATUS_ORDER } from '@/lib/logistics';
import { BRAND_NAME } from '@/lib/branding';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function PortalShipmentDetail() {
  const { id } = useParams();
  const { tenant, t, session } = useOutletContext();
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const record = await base44.entities.Shipment.get(id).catch(() => null);
      if (cancelled) return;
      setShipment(record);
      if (record) {
        const [history, team] = await Promise.all([
          base44.entities.ShipmentEvent.filter({ shipment_id: id }, { sort: '-occurred_at', limit: 60 }),
          base44.entities.TeamMember.filter({ tenant_id: tenant.id, role: 'driver' }),
        ]);
        if (cancelled) return;
        setEvents(history.items || history || []);
        setDrivers(team);
        if (record.pod_photo_uri) {
          const signed = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: record.pod_photo_uri,
          }).catch(() => null);
          if (!cancelled && signed?.signed_url) setPhotoUrl(signed.signed_url);
        }
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, tenant.id]);

  const addEvent = async (status, eventType, eventNote, extra = {}) => {
    const memberEmails = shipment.member_emails?.length
      ? shipment.member_emails
      : [tenant.owner_email, session?.user?.email].filter(Boolean);
    await base44.entities.ShipmentEvent.create({
      tenant_id: tenant.id,
      shipment_id: shipment.id,
      tracking_number: shipment.tracking_number,
      status,
      event_type: eventType,
      location: `${shipment.receiver_city}, ${shipment.receiver_country}`,
      note: eventNote,
      occurred_at: new Date().toISOString(),
      visible_public: true,
      member_emails: memberEmails,
      ...extra,
    });
  };

  const updateStatus = async (status) => {
    setBusy(true);
    await base44.entities.Shipment.update(shipment.id, { status });
    // Side channel: let the agency's own endpoints hear about the change.
    base44.functions
      .invoke('shipmentWebhook', {
        shipment_id: shipment.id,
        event: 'shipment.status_changed',
        previous_status: shipment.status,
      })
      .catch(() => null);
    await addEvent(status, status === 'out_for_delivery' ? 'out_for_delivery' : 'note', t(`status.${status}`));
    setShipment((prev) => ({ ...prev, status }));
    setEvents((prev) => [
      {
        id: `local-${Date.now()}`,
        status,
        event_type: status === 'out_for_delivery' ? 'out_for_delivery' : 'note',
        note: t(`status.${status}`),
        occurred_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setBusy(false);
  };

  const assignDriver = async (email) => {
    setBusy(true);
    await base44.entities.Shipment.update(shipment.id, { assigned_driver_email: email });
    if (email) {
      const driver = drivers.find((d) => d.email === email);
      if (driver) {
        await base44.entities.TeamMember.update(driver.id, { availability: 'on_delivery' });
      }
      await addEvent(shipment.status, 'note', `${t('ship.assignDriver')}: ${email}`, { driver_email: email });
    }
    setShipment((prev) => ({ ...prev, assigned_driver_email: email }));
    setBusy(false);
  };

  const submitNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    await addEvent(shipment.status, 'note', note.trim());
    setEvents((prev) => [
      { id: `local-${Date.now()}`, status: shipment.status, event_type: 'note', note: note.trim(), occurred_at: new Date().toISOString() },
      ...prev,
    ]);
    setNote('');
    setBusy(false);
  };

  const printLabel = () => {
    const win = window.open('', '_blank', 'width=520,height=680');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${shipment.tracking_number}</title>
      <style>
        *{box-sizing:border-box;font-family:'Poppins',Arial,sans-serif}
        body{margin:0;padding:28px;color:#3D1E00}
        .card{border:2px solid #3D1E00;border-radius:16px;padding:22px}
        .brand{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:14px}
        .brand b{font-size:18px}
        .tn{font-size:26px;letter-spacing:2px;margin:18px 0 6px;font-weight:700}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px;font-size:13px}
        .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8a7a6a}
        .bars{margin-top:20px;height:64px;background:repeating-linear-gradient(90deg,#3D1E00 0 2px,transparent 2px 4px,#3D1E00 4px 5px,transparent 5px 9px)}
        .foot{margin-top:16px;font-size:11px;color:#8a7a6a;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="card">
        <div class="brand"><b>${BRAND_NAME}</b><span style="font-size:12px">${shipment.tenant_name || ''}</span></div>
        <div class="label">${t('waybill.tracking')}</div>
        <div class="tn">${shipment.tracking_number}</div>
        <div class="label">${t('waybill.waybill')} ${shipment.waybill_number || ''}</div>
        <div class="grid">
          <div><div class="label">${t('waybill.from')}</div>${shipment.sender_name}<br>${shipment.sender_city}, ${shipment.sender_country}</div>
          <div><div class="label">${t('waybill.to')}</div>${shipment.receiver_name}<br>${shipment.receiver_address}<br>${shipment.receiver_city}, ${shipment.receiver_country}</div>
        </div>
        <div class="grid">
          <div><div class="label">${t('waybill.piecesWeight')}</div>${shipment.pieces} × ${shipment.weight_kg} kg</div>
          <div><div class="label">${t('waybill.payment')}</div>${shipment.payment_mode === 'cod' ? `COD ${shipment.cod_amount} ${shipment.currency}` : t('waybill.prepaid')}</div>
        </div>
        <div class="bars"></div>
        <div class="foot"><span>${shipment.receiver_phone}</span><span>${shipment.tracking_number}</span></div>
      </div>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">{t('ship.notFound')}</p>
        <Button asChild variant="outline" className="mt-5 rounded-2xl">
          <Link to="/portal/shipments">{t('common.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/portal/shipments"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary transition hover:border-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-mono text-xl font-semibold text-primary">{shipment.tracking_number}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('ship.detail')} · {formatDate(shipment.created_date)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              SHIPMENT_STATUS_CLASS[shipment.status] || SHIPMENT_STATUS_CLASS.created
            }`}
          >
            {t(`status.${shipment.status}`)}
          </span>
          <Button variant="outline" className="rounded-2xl" onClick={printLabel}>
            <Printer className="mr-2 h-4 w-4" />
            {t('ship.printLabel')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.sender')}</p>
                <p className="mt-2 font-medium text-primary">{shipment.sender_name}</p>
                <p className="text-sm text-muted-foreground">{shipment.sender_phone}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[shipment.sender_address, shipment.sender_city, shipment.sender_country].filter(Boolean).join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('ship.receiver')}</p>
                <p className="mt-2 font-medium text-primary">{shipment.receiver_name}</p>
                <p className="text-sm text-muted-foreground">{shipment.receiver_phone}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[shipment.receiver_address, shipment.receiver_city, shipment.receiver_country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {shipment.receiver_what3words && (
                  <p className="mt-1 font-mono text-xs text-accent">{shipment.receiver_what3words}</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('common.weight')}</p>
                <p className="mt-1 font-medium text-primary">
                  {shipment.weight_kg} kg ({shipment.chargeable_weight_kg || shipment.weight_kg} kg {t('rate.chargeable').toLowerCase()})
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('rate.service')}</p>
                <p className="mt-1 font-medium capitalize text-primary">{shipment.service_type}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('rate.total')}</p>
                <p className="mt-1 font-medium text-primary">
                  {formatMoney(shipment.total_amount, shipment.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('rate.eta')}</p>
                <p className="mt-1 font-medium text-primary">{shipment.eta_date || '—'}</p>
              </div>
            </div>

            {shipment.description && (
              <p className="mt-5 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                {shipment.description}
              </p>
            )}
          </div>

          {shipment.status === 'delivered' && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
              <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {t('ship.pod')}
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 text-sm text-emerald-900">
                  <p>
                    {t('track.deliveredTo')}: <span className="font-medium">{shipment.pod_recipient_name}</span>
                  </p>
                  <p>{formatDate(shipment.pod_at)}</p>
                  {shipment.pod_signature && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                        <PenLine className="h-3.5 w-3.5" />
                        {t('driver.signature')}
                      </p>
                      <img
                        src={shipment.pod_signature}
                        alt="Signature"
                        className="mt-2 h-24 w-full max-w-[260px] rounded-xl border border-emerald-200 bg-white object-contain"
                      />
                    </div>
                  )}
                </div>
                {photoUrl && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-900">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {t('driver.photo')}
                    </p>
                    <img
                      src={photoUrl}
                      alt="Proof of delivery"
                      className="mt-2 h-48 w-full rounded-xl border border-emerald-200 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('track.timeline')}
            </h2>
            <ol className="mt-5 space-y-5 border-l border-border pl-6">
              {events.map((event, index) => (
                <li key={event.id || index} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full ring-4 ring-card ${
                      index === 0 ? 'bg-accent' : 'bg-primary/25'
                    }`}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-heading text-sm font-semibold text-primary">
                      {t(`event.${event.event_type}`)}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatDate(event.occurred_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[event.location, event.hub_name].filter(Boolean).join(' · ')}
                    {event.note ? ` — ${event.note}` : ''}
                  </p>
                </li>
              ))}
              {events.length === 0 && <li className="text-sm text-muted-foreground">{t('track.noEvents')}</li>}
            </ol>

            <form onSubmit={submitNote} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('ship.eventNote')}
                className={inputClass}
              />
              <Button type="submit" disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                {t('ship.addEvent')}
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('ship.changeStatus')}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...SHIPMENT_STATUS_ORDER, 'failed', 'returned', 'cancelled'].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus(value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    shipment.status === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-accent/12 hover:text-accent'
                  }`}
                >
                  {t(`status.${value}`)}
                </button>
              ))}
            </div>

            <h2 className="mt-7 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('ship.assignDriver')}
            </h2>
            <select
              value={shipment.assigned_driver_email || ''}
              onChange={(event) => assignDriver(event.target.value)}
              className={`mt-3 ${inputClass}`}
            >
              <option value="">{t('fleet.unassigned')}</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.email}>
                  {driver.full_name} · {driver.availability}
                </option>
              ))}
            </select>

            {shipment.payment_mode === 'cod' && (
              <div className="mt-6 rounded-2xl bg-accent/10 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('track.cod')}</p>
                <p className="mt-1 font-heading text-lg font-semibold text-primary">
                  {formatMoney(shipment.cod_amount, shipment.currency)}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('ship.otp')}
            </h2>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-[0.3em] text-primary">
              {shipment.delivery_otp || '——'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('ship.otpHint')}</p>

            <Button asChild variant="outline" className="mt-6 w-full rounded-2xl">
              <a href={`/track?numbers=${shipment.tracking_number}`} target="_blank" rel="noreferrer">
                {t('ship.publicPage')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}