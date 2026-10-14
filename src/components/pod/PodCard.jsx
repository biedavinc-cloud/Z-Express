import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, PenLine, Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/logistics';
import { useI18n } from '@/components/LanguageProvider';

// One proof of delivery: recipient, timestamp, signature and the private photo
// opened through a short-lived signed link.
export default function PodCard({ shipment }) {
  const { t } = useI18n();
  const [photoUrl, setPhotoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadPhoto = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: shipment.pod_photo_uri,
      });
      setPhotoUrl(signed_url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-muted-foreground">{shipment.tracking_number}</p>
          <p className="mt-1 font-heading text-sm font-semibold text-primary">
            {shipment.receiver_city}
            {shipment.receiver_country ? `, ${shipment.receiver_country}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
          {t('status.delivered')}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">{t('pod.recipient')}</dt>
          <dd className="font-medium text-primary">{shipment.pod_recipient_name || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('pod.signedAt')}</dt>
          <dd className="font-medium text-primary">{formatDate(shipment.pod_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-secondary/60 p-2">
          <p className="px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('pod.signature')}
          </p>
          {shipment.pod_signature ? (
            <img
              src={shipment.pod_signature}
              alt={t('pod.signature')}
              className="mt-1 h-20 w-full rounded-xl bg-card object-contain"
            />
          ) : (
            <p className="mt-1 flex h-20 items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" />
              {t('pod.noSignature')}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-secondary/60 p-2">
          <p className="px-1 text-[11px] uppercase tracking-wider text-muted-foreground">{t('pod.photo')}</p>
          {photoUrl ? (
            <img src={photoUrl} alt={t('pod.photo')} className="mt-1 h-20 w-full rounded-xl object-cover" />
          ) : shipment.pod_photo_uri ? (
            <button
              type="button"
              onClick={loadPhoto}
              disabled={busy}
              className="mt-1 flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-card text-[11px] text-muted-foreground transition hover:text-accent"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {busy ? t('pod.loadingPhoto') : t('pod.loadPhoto')}
            </button>
          ) : (
            <p className="mt-1 flex h-20 items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              {t('pod.noPhoto')}
            </p>
          )}
          {failed && <p className="mt-1 text-[11px] text-destructive">{t('pod.photoError')}</p>}
        </div>
      </div>

      <Link
        to={`/portal/shipments/${shipment.id}`}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-accent"
      >
        <MapPin className="h-3.5 w-3.5" />
        {t('pod.openShipment')}
      </Link>
    </div>
  );
}