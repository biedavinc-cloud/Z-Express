import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  Navigation,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignaturePad from '@/components/driver/SignaturePad';
import { useI18n } from '@/components/LanguageProvider';
import { resolveSession } from '@/lib/session';
import { formatMoney, NDR_REASONS } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function DriverStop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('deliver');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [otp, setOtp] = useState('');
  const [recipient, setRecipient] = useState('');
  const [signature, setSignature] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ndrReason, setNdrReason] = useState('customer_unreachable');
  const [ndrNote, setNdrNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const resolved = await resolveSession();
      const record = await base44.entities.Shipment.get(id).catch(() => null);
      if (cancelled) return;
      setSession(resolved);
      setShipment(record);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setPhotoUri(file_uri);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  // The server decides what went wrong; this screen only translates it.
  const failureMessage = (code) => {
    if (code === 'invalid_otp') return t('driver.otpInvalid');
    if (code === 'missing_signature') return t('driver.signatureRequired');
    if (code === 'missing_photo') return t('driver.photoRequired');
    if (code === 'missing_recipient') return t('driver.recipientRequired');
    if (code === 'not_assigned') return t('driver.notAssigned');
    if (code === 'closed') return t('driver.alreadyClosed');
    return t('common.error');
  };

  // Delivery and failed attempts are validated and written by the server, so the
  // code, the signature and the photo cannot be bypassed from this screen.
  const runOp = async (payload) => {
    const response = await base44.functions
      .invoke('shipmentOps', { shipment_id: shipment.id, ...payload })
      .catch(() => null);
    return response?.data || {};
  };

  const complete = async () => {
    setError('');
    if (!recipient.trim()) {
      setError(t('driver.recipientRequired'));
      return;
    }
    if (!signature) {
      setError(t('driver.signatureRequired'));
      return;
    }
    if (!photoUri) {
      setError(t('driver.photoRequired'));
      return;
    }
    setBusy(true);
    const result = await runOp({
      action: 'pod',
      otp,
      recipient: recipient.trim(),
      signature,
      photo_uri: photoUri,
    });
    setBusy(false);
    if (!result.ok) {
      setError(failureMessage(result.code));
      return;
    }
    setDone(t('driver.delivered'));
  };

  const submitNdr = async () => {
    setBusy(true);
    const result = await runOp({
      action: 'ndr',
      reason: ndrReason,
      note: ndrNote.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(failureMessage(result.code));
      return;
    }
    setDone(t('driver.ndrSubmitted'));
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t('ship.notFound')}</p>
          <Button variant="outline" className="mt-5 rounded-2xl" onClick={() => navigate('/driver')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-9 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="mt-6 font-heading text-lg font-semibold text-primary">{done}</p>
          <Button
            onClick={() => navigate('/driver')}
            className="mt-7 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {t('driver.todayStops')}
          </Button>
        </div>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [shipment.receiver_address, shipment.receiver_city, shipment.receiver_country].filter(Boolean).join(', ')
  )}`;

  return (
    <div className="min-h-screen bg-secondary/40 pb-12">
      <header className="zx-safe-top bg-primary px-5 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-2xl">
          <Link to="/driver" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70">
            <ArrowLeft className="h-4 w-4" />
            {t('driver.title')}
          </Link>
          <p className="mt-5 font-mono text-xs text-accent">{shipment.tracking_number}</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">{shipment.receiver_name}</h1>
          <p className="mt-2 flex items-start gap-2 text-sm text-primary-foreground/75">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {[shipment.receiver_address, shipment.receiver_city, shipment.receiver_country].filter(Boolean).join(', ')}
          </p>
          {shipment.receiver_what3words && (
            <p className="mt-1 font-mono text-xs text-primary-foreground/60">///{shipment.receiver_what3words}</p>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-5 max-w-2xl px-5">
        <div className="rounded-3xl border border-border bg-card p-6 zx-shadow">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              <Navigation className="h-4 w-4 text-accent" />
              {t('driver.navigate')}
            </a>
            <a
              href={`tel:${shipment.receiver_phone}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-primary"
            >
              <Phone className="h-4 w-4 text-accent" />
              {t('driver.call')}
            </a>
          </div>

          {shipment.payment_mode === 'cod' && shipment.cod_amount > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent/12 px-4 py-3 text-sm text-primary">
              <Banknote className="h-4 w-4 text-accent" />
              {t('driver.collectCod', { amount: formatMoney(shipment.cod_amount, shipment.currency) })}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {['deliver', 'ndr'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setError('');
                }}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {key === 'deliver' ? t('driver.deliver') : t('driver.ndr')}
              </button>
            ))}
          </div>

          {mode === 'deliver' ? (
            <div className="mt-6 space-y-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('driver.otpTitle')}</label>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="••••••"
                  className={`mt-2 text-center font-mono text-2xl tracking-[0.5em] ${inputClass}`}
                />
                <p className="mt-2 text-xs text-muted-foreground">{t('driver.otpHint')}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('driver.recipient')}</label>
                <input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              </div>

              <SignaturePad
                label={t('driver.signature')}
                hint={t('driver.signatureHint')}
                clearLabel={t('driver.clear')}
                onChange={setSignature}
              />

              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('driver.photo')}</label>
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground transition hover:border-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : photoUri ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Camera className="h-4 w-4 text-accent" />
                  )}
                  {photoUri ? t('common.copied') : t('driver.photoHint')}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadPhoto} />
                </label>
                {!photoUri && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" />
                    {t('driver.photoHint')}
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                onClick={complete}
                disabled={busy}
                size="lg"
                className="w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t('driver.complete')}
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-2 rounded-2xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t('driver.ndr')}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('driver.ndrReason')}</label>
                <select
                  value={ndrReason}
                  onChange={(event) => setNdrReason(event.target.value)}
                  className={`mt-2 ${inputClass}`}
                >
                  {NDR_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {t(`driver.ndrReasons.${reason}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('driver.ndrNote')}</label>
                <textarea
                  rows={3}
                  value={ndrNote}
                  onChange={(event) => setNdrNote(event.target.value)}
                  className={`mt-2 resize-none ${inputClass}`}
                />
              </div>

              <Button
                onClick={submitNdr}
                disabled={busy}
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-destructive/40 text-destructive"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('driver.submitNdr')}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}