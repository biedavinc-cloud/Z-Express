import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building2 } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { MARKET_COVERAGE } from '@/lib/logistics';

const AFRICA_CENTER = [6.5, 17];

function markerIcon(type) {
  const isHub = type === 'hub';
  return L.divIcon({
    className: 'zx-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(61,30,0,.4);background:${
      isHub ? '#FF8E24' : '#3D1E00'
    }"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function NetworkMap() {
  const { t } = useI18n();
  const [active, setActive] = useState(MARKET_COVERAGE[0]);

  return (
    <section id="network" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('network.title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{t('network.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-accent ring-2 ring-background" />
            {t('network.hub')}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
            {t('network.agency')} / {t('network.sorting')}
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-[420px] overflow-hidden rounded-3xl border border-border zx-shadow">
          <MapContainer
            center={AFRICA_CENTER}
            zoom={3}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {MARKET_COVERAGE.map((point) => (
              <Marker
                key={`${point.country}-${point.city}`}
                position={[point.lat, point.lng]}
                icon={markerIcon(point.type)}
                eventHandlers={{ click: () => setActive(point) }}
              >
                <Popup>
                  <strong>{point.city}</strong>
                  <br />
                  {point.country}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('network.offices')}
          </h3>
          <div className="mt-4 max-h-[360px] space-y-1.5 overflow-y-auto pr-1 zx-scrollbar-none">
            {MARKET_COVERAGE.map((point) => {
              const isActive = active.city === point.city;
              return (
                <button
                  key={`${point.country}-${point.city}`}
                  type="button"
                  onClick={() => setActive(point)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      isActive ? 'bg-accent text-accent-foreground' : 'bg-accent/12 text-accent'
                    }`}
                  >
                    {point.type === 'hub' ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{point.city}</span>
                    <span className={`block truncate text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {point.country} · {t(`network.${point.type === 'sorting_center' ? 'sorting' : point.type}`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}