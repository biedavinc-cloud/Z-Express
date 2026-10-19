import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Loader2, MapPin } from 'lucide-react';
import { api } from '@/api/client';
import { useI18n } from '@/components/LanguageProvider';

const AFRICA_CENTER = [6.5, 17];

const TYPE_KEY = {
  hub: 'network.hub',
  sorting_center: 'network.sorting',
  agency: 'network.agency',
  pickup_point: 'network.pickup',
};

function markerIcon(type) {
  const isHub = type === 'hub';
  const size = isHub ? 18 : 14;
  return L.divIcon({
    className: 'zx-marker',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(61,30,0,.4);background:${
      isHub ? '#FF8E24' : '#3D1E00'
    }"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// The map frames whatever the agencies have registered, wherever they are.
function FitNetwork({ offices }) {
  const map = useMap();
  const key = offices.map((office) => `${office.lat},${office.lng}`).join('|');

  useEffect(() => {
    if (!offices.length) return;
    if (offices.length === 1) map.setView([offices[0].lat, offices[0].lng], 6);
    else map.fitBounds(L.latLngBounds(offices.map((office) => [office.lat, office.lng])), { padding: [54, 54] });
  }, [map, key, offices]);

  return null;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-primary">{value}</p>
    </div>
  );
}

export default function NetworkMap() {
  const { t } = useI18n();
  const [offices, setOffices] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  // Drawn from the offices the agencies registered — an agency that opens a hub
  // appears here without anyone editing the site.
  useEffect(() => {
    let cancelled = false;
    api.functions
      .invoke('publicNetwork', {})
      .then((response) => {
        if (cancelled) return;
        const data = response?.data || {};
        setOffices(data.offices || []);
        setTotals(data.totals || null);
        setActive((data.offices || [])[0] || null);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      {totals && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t('network.officesTotal')} value={totals.offices} />
          <Stat label={t('network.hub')} value={totals.hubs} />
          <Stat label={t('network.cities')} value={totals.cities} />
          <Stat label={t('network.countries')} value={totals.countries} />
        </div>
      )}

      {loading && (
        <div className="mt-10 flex items-center gap-3 rounded-3xl border border-border bg-card px-6 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      )}

      {!loading && offices.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="mt-5 font-heading text-lg font-semibold text-primary">{t('network.empty')}</p>
        </div>
      )}

      {!loading && offices.length > 0 && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
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
              <FitNetwork offices={offices} />
              {offices.map((office) => (
                <Marker
                  key={office.id}
                  position={[office.lat, office.lng]}
                  icon={markerIcon(office.type)}
                  eventHandlers={{ click: () => setActive(office) }}
                >
                  <Popup>
                    <strong>{office.name || office.city}</strong>
                    {office.city ? (
                      <>
                        <br />
                        {[office.city, office.country].filter(Boolean).join(', ')}
                      </>
                    ) : null}
                    {office.carrier ? (
                      <>
                        <br />
                        {office.carrier}
                      </>
                    ) : null}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('network.offices')}
            </h3>
            <div className="zx-scrollbar-none mt-4 max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
              {offices.map((office) => {
                const isActive = active?.id === office.id;
                const typeLabel = t(TYPE_KEY[office.type] || 'network.agency');
                return (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => setActive(office)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        isActive ? 'bg-accent text-accent-foreground' : 'bg-accent/12 text-accent'
                      }`}
                    >
                      {office.type === 'hub' ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{office.name || office.city}</span>
                      <span
                        className={`block truncate text-xs ${
                          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {[office.city, office.country].filter(Boolean).join(' · ')} · {typeLabel}
                      </span>
                      {office.carrier && (
                        <span
                          className={`mt-0.5 block truncate text-[11px] ${
                            isActive ? 'text-primary-foreground/60' : 'text-muted-foreground/80'
                          }`}
                        >
                          {t('network.carrier')}: {office.carrier}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}