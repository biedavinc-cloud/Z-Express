import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, LocateFixed } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';

const FALLBACK_CENTER = [4.0511, 9.7679];

const pinIcon = L.divIcon({
  className: 'zx-marker',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 6px 16px rgba(61,30,0,.45);background:#FF8E24"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickCatcher({ onPick }) {
  useMapEvents({
    click: (event) => onPick([event.latlng.lat, event.latlng.lng]),
  });
  return null;
}

// Leaflet measures its container on mount; inside a dialog that is still opening it
// would otherwise paint a grey half-map, so the size is refreshed once it settles.
function FitToFrame() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 260);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FollowPoint({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 13));
  }, [map, position]);
  return null;
}

export default function PickupMapPicker({ value, onPick, center }) {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState('');
  const start = value || center || FALLBACK_CENTER;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setNotice(t('pickup.unavailable'));
      return;
    }
    setLocating(true);
    setNotice('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onPick([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setLocating(false);
        setNotice(t('pickup.unavailable'));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <div className="relative h-[300px] overflow-hidden rounded-2xl border border-border sm:h-[360px]">
        <MapContainer center={start} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickCatcher onPick={onPick} />
          <FitToFrame />
          <FollowPoint position={value} />
          {value && (
            <Marker
              position={value}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const point = event.target.getLatLng();
                  onPick([point.lat, point.lng]);
                },
              }}
            />
          )}
        </MapContainer>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-primary shadow-lg ring-1 ring-border transition hover:bg-secondary disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          {locating ? t('pickup.locating') : t('pickup.useMyLocation')}
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {notice || t('pickup.hint')}
      </p>
    </div>
  );
}