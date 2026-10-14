import React, { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// One map for every live view — the customer's parcel position and the dispatch
// fleet — so pins, colours and framing behave the same everywhere.

const BRAND = '#3D1E00';
const ACCENT = '#FF8E24';

const MOVING = ['current', 'driver', 'parcel'];

function pinIcon(kind) {
  const color = MOVING.includes(kind) ? ACCENT : BRAND;
  const size = kind === 'current' ? 20 : kind === 'event' ? 12 : 15;
  return L.divIcon({
    className: 'zx-marker',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(61,30,0,.45);background:${color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Leaflet only measures its container once; inside a card that is still laying
// out it would paint a half-grey map.
function FitPoints({ points }) {
  const map = useMap();
  const key = points.map((point) => point.join(',')).join('|');

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    const timer = setTimeout(() => map.invalidateSize(), 240);
    return () => clearTimeout(timer);
  }, [map, key]);

  return null;
}

export default function LiveMap({ pins = [], path = [], height = 'h-[320px]', center = [6.5, 17], zoom = 4 }) {
  const points = pins.map((pin) => [pin.lat, pin.lng]);
  const trail = path.filter((point) => Array.isArray(point) && point.length === 2);

  return (
    <div className={`${height} overflow-hidden rounded-2xl border border-border`}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitPoints points={points} />
        {trail.length > 1 && <Polyline positions={trail} pathOptions={{ color: ACCENT, weight: 3, dashArray: '6 8' }} />}
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={pinIcon(pin.kind)}>
            {(pin.label || pin.detail) && (
              <Tooltip>
                <strong>{pin.label}</strong>
                {pin.detail ? (
                  <>
                    <br />
                    {pin.detail}
                  </>
                ) : null}
              </Tooltip>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}