import React from 'react';
import { AlertTriangle, Loader2, Satellite, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import useDriverTracking from '@/hooks/useDriverTracking';
import { formatDate } from '@/lib/logistics';

// The driver's live position switch. While it is on, the customer's tracking page
// shows the parcel moving and dispatch can see who is nearest to a pickup.
export default function GpsTracker({ tenantId, shipmentId = null, autoStart = false, className = '' }) {
  const { t } = useI18n();
  const { sharing, status, position, lastSentAt, sending, start, stop } = useDriverTracking({
    tenantId,
    shipmentId,
    autoStart,
  });

  const notice =
    status === 'denied'
      ? t('driver.gps.denied')
      : status === 'unsupported'
        ? t('driver.gps.unsupported')
        : status === 'error'
          ? t('driver.gps.error')
          : '';

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Satellite className="h-4 w-4" />
          <span className="font-heading text-sm font-semibold text-primary">{t('driver.gps.title')}</span>
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            sharing ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          {sharing ? t('driver.gps.live') : t('driver.gps.idle')}
        </span>
      </div>

      {notice ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {notice}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {sharing && position
            ? [
                t('driver.gps.accuracy', { meters: position.accuracy }),
                lastSentAt ? t('driver.gps.lastSent', { time: formatDate(lastSentAt) }) : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : t('driver.gps.hint')}
        </p>
      )}

      <div className="mt-4">
        {sharing ? (
          <Button variant="outline" onClick={stop} className="w-full rounded-xl border-destructive/40 text-destructive">
            <Square className="mr-2 h-3.5 w-3.5" />
            {t('driver.gps.stop')}
          </Button>
        ) : (
          <Button
            onClick={start}
            disabled={status === 'locating'}
            className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {status === 'locating' || sending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Satellite className="mr-2 h-3.5 w-3.5" />
            )}
            {status === 'locating' ? t('driver.gps.locating') : t('driver.gps.start')}
          </Button>
        )}
      </div>
    </div>
  );
}