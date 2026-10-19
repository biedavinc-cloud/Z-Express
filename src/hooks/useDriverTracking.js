import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';

// Live position sharing for the driver app. The browser watch runs while the
// screen is open and every fix is pushed to the server, which stamps it on the
// driver and on the parcel being carried — that is what the customer's live map
// and the dispatch cockpit read.

const SHARING_KEY = 'zx_gps_sharing';
const MIN_INTERVAL_MS = 35000;
const MIN_MOVE_METERS = 150;

function distanceMeters(from, to) {
  const rad = (value) => (value * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// A single fix, for actions that must carry the spot they happened at (a
// delivery, a failed attempt). Resolves to null when the phone cannot answer.
export function readPosition(options) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000, ...(options || {}) }
    );
  });
}

export default function useDriverTracking({ tenantId = '', shipmentId = null, autoStart = false } = {}) {
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | locating | live | denied | error | unsupported
  const [position, setPosition] = useState(null);
  const [lastSentAt, setLastSentAt] = useState('');
  const [sending, setSending] = useState(false);
  const watchRef = useRef(null);
  const lastRef = useRef({ at: 0, lat: null, lng: null });
  const sendingRef = useRef(false);

  const push = useCallback(
    async (coords) => {
      const now = Date.now();
      const moved = lastRef.current.lat === null ? Number.POSITIVE_INFINITY : distanceMeters(lastRef.current, coords);
      // One ping every 35 s, plus an immediate one as soon as the driver has
      // actually moved: the trail stays live without hammering the database.
      if (now - lastRef.current.at < MIN_INTERVAL_MS && moved < MIN_MOVE_METERS) return;
      if (sendingRef.current) return;
      lastRef.current = { at: now, lat: coords.lat, lng: coords.lng };
      sendingRef.current = true;
      setSending(true);
      try {
        await api.functions.invoke('driverLocation', {
          tenant_id: tenantId || undefined,
          shipment_id: shipmentId || undefined,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
        });
        setLastSentAt(new Date().toISOString());
      } catch (error) {
        // A dropped ping is retried by the next fix; it never interrupts the tour.
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [shipmentId, tenantId]
  );

  const stop = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
    setSharing(false);
    setStatus('idle');
    try {
      window.localStorage.setItem(SHARING_KEY, '0');
    } catch (error) {
      // Private browsing: sharing simply is not remembered.
    }
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    if (watchRef.current !== null) return;
    setStatus('locating');
    setSharing(true);
    try {
      window.localStorage.setItem(SHARING_KEY, '1');
    } catch (error) {
      // Private browsing: sharing simply is not remembered.
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (fix) => {
        const coords = {
          lat: fix.coords.latitude,
          lng: fix.coords.longitude,
          accuracy: Math.round(fix.coords.accuracy || 0),
        };
        setPosition(coords);
        setStatus('live');
        push(coords);
      },
      (error) => {
        setStatus(error && error.code === 1 ? 'denied' : 'error');
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 25000 }
    );
  }, [push]);

  // A driver who switched sharing on keeps it on when the phone reopens the app.
  useEffect(() => {
    if (!autoStart) return;
    let remembered = false;
    try {
      remembered = window.localStorage.getItem(SHARING_KEY) === '1';
    } catch (error) {
      remembered = false;
    }
    if (remembered) start();
  }, [autoStart, start]);

  useEffect(
    () => () => {
      if (watchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    },
    []
  );

  return { sharing, status, position, lastSentAt, sending, start, stop };
}