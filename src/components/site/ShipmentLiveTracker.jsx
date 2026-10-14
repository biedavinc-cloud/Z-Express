import React from 'react';
import { Navigation } from 'lucide-react';
import LiveMap from '@/components/site/LiveMap';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate } from '@/lib/logistics';

// The customer-facing live view: where the parcel is now, the route it is on, and
// the scans that were geotagged. Coordinates reaching this component are already
// rounded by the server, so a public page never reveals a doorstep.
export default function ShipmentLiveTracker({ shipment, events }) {
  const { t } = useI18n();

  const origin =
    shipment.sender_lat && shipment.sender_lng
      ? { id: 'origin', kind: 'origin', lat: shipment.sender_lat, lng: shipment.sender_lng, label: shipment.sender_city || t('track.from') }
      : null;
  const destination =
    shipment.receiver_lat && shipment.receiver_lng
      ? {
          id: 'destination',
          kind: 'destination',
          lat: shipment.receiver_lat,
          lng: shipment.receiver_lng,
          label: shipment.receiver_city || t('track.to'),
        }
      : null;
  const current =
    shipment.current_lat && shipment.current_lng
      ? {
          id: 'current',
          kind: 'current',
          lat: shipment.current_lat,
          lng: shipment.current_lng,
          label: t('track.liveTitle'),
          detail: shipment.courier_name || '',
        }
      : null;
  const scans = (events || [])
    .filter((event) => event.lat && event.lng)
    .slice(0, 6)
    .map((event, index) => ({
      id: `event-${index}`,
      kind: 'event',
      lat: event.lat,
      lng: event.lng,
      label: t(`event.${event.event_type}`),
      detail: formatDate(event.occurred_at),
    }));

  const pins = [origin, destination, current, ...scans].filter(Boolean);
  const trail = [origin, current, destination].filter(Boolean).map((pin) => [pin.lat, pin.lng]);

  if (!pins.length) {
    return (
      <div className="border-b border-border px-6 py-4 text-xs text-muted-foreground">{t('track.liveWaiting')}</div>
    );
  }

  return (
    <div className="border-b border-border px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-primary">
          <Navigation className="h-4 w-4" />
          {t('track.liveTitle')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {current
            ? [
                t('track.liveUpdated', { time: formatDate(shipment.last_gps_at) }),
                shipment.courier_name ? `${t('track.courier')}: ${shipment.courier_name}` : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : t('track.liveWaiting')}
        </p>
      </div>
      <div className="mt-4">
        <LiveMap pins={pins} path={trail} height="h-[300px]" />
      </div>
    </div>
  );
}