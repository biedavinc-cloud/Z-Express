export const SHIPMENT_STATUS_ORDER = [
  'created',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
  'delivered',
];

export const SHIPMENT_STATUS_CLASS = {
  created: 'bg-muted text-muted-foreground',
  picked_up: 'bg-primary/10 text-primary',
  in_transit: 'bg-accent/15 text-accent',
  at_hub: 'bg-primary/10 text-primary',
  out_for_delivery: 'bg-accent text-accent-foreground',
  delivered: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-destructive/10 text-destructive',
  returned: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

export const SERVICE_TYPES = ['express', 'standard', 'freight', 'fulfillment'];
export const PAYMENT_MODES = ['prepaid', 'cod'];

export const VEHICLE_TYPES = ['motorbike', 'car', 'van', 'truck', 'bicycle'];

export const NDR_REASONS = [
  'customer_unreachable',
  'address_incomplete',
  'rescheduled',
  'refused',
  'access_denied',
];

export const HUB_TYPES = ['hub', 'sorting_center', 'agency', 'pickup_point'];

export const SURCHARGE_TYPES = ['remote_area', 'fuel', 'express', 'peak_season', 'oversize'];

// When a surcharge rule kicks in: always, above a chargeable weight, above a
// volumetric weight, or on one specific zone.
export const SURCHARGE_BASES = ['always', 'weight', 'volumetric', 'zone'];

export const PRICING_MODELS = ['flat', 'weight', 'distance', 'tiered'];

// The plan table and its pricing rules live in one module; re-exported here so
// every screen keeps importing plans from the same place.
export { PLANS, PLAN_IDS, YEARLY_DISCOUNT, TRIAL_DAYS, EXTRA_SEAT_MONTHLY } from './pricing';

// Translated feature bullets shown on the public pricing page and in the
// onboarding plan picker.
export const PLAN_FEATURE_KEYS = {
  starter: ['plan.starter.f1', 'plan.starter.f2', 'plan.starter.f3'],
  pro: ['plan.pro.f1', 'plan.pro.f2', 'plan.pro.f3'],
  enterprise: ['plan.enterprise.f1', 'plan.enterprise.f2', 'plan.enterprise.f3'],
};

export const BILLING_CYCLES = ['monthly', 'yearly'];

export const CURRENCIES = [
  'XAF',
  'XOF',
  'NGN',
  'GHS',
  'KES',
  'TZS',
  'RWF',
  'UGX',
  'CDF',
  'ZAR',
  'MAD',
  'EGP',
  'ETB',
  'AED',
  'SAR',
  'EUR',
  'GBP',
  'USD',
];

// Countries live in their own module; re-exported here so every screen keeps
// importing them from one obvious place.
export { COUNTRIES, DEFAULT_COUNTRY } from './countries';

export const CITIES = [
  'Douala',
  'Yaoundé',
  'Lagos',
  'Abuja',
  'Accra',
  'Kumasi',
  'Dakar',
  'Abidjan',
  'Nairobi',
  'Mombasa',
  'Dar es Salaam',
  'Kigali',
  'Kampala',
  'Johannesburg',
  'Cape Town',
  'Casablanca',
  'Cairo',
  'Dubai',
  'Sharjah',
];

export const MARKET_COVERAGE = [
  { country: 'Cameroon', city: 'Douala', lat: 4.0511, lng: 9.7679, type: 'hub' },
  { country: 'Cameroon', city: 'Yaoundé', lat: 3.848, lng: 11.5021, type: 'sorting_center' },
  { country: 'Nigeria', city: 'Lagos', lat: 6.5244, lng: 3.3792, type: 'hub' },
  { country: 'Ghana', city: 'Accra', lat: 5.6037, lng: -0.187, type: 'agency' },
  { country: 'Senegal', city: 'Dakar', lat: 14.7167, lng: -17.4677, type: 'agency' },
  { country: "Côte d'Ivoire", city: 'Abidjan', lat: 5.36, lng: -4.0083, type: 'sorting_center' },
  { country: 'Kenya', city: 'Nairobi', lat: -1.2921, lng: 36.8219, type: 'hub' },
  { country: 'Rwanda', city: 'Kigali', lat: -1.9441, lng: 30.0619, type: 'agency' },
  { country: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'hub' },
  { country: 'South Africa', city: 'Johannesburg', lat: -26.2041, lng: 28.0473, type: 'hub' },
];

export function formatMoney(amount, currency) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: value < 100 ? 2 : 0,
    }).format(value);
  } catch (error) {
    return `${value.toFixed(2)} ${currency || ''}`.trim();
  }
}

export function formatDate(value, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function haversineKm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad((b.lat || 0) - (a.lat || 0));
  const dLng = toRad((b.lng || 0) - (a.lng || 0));
  const lat1 = toRad(a.lat || 0);
  const lat2 = toRad(b.lat || 0);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function parseTrackingNumbers(input) {
  return Array.from(
    new Set(
      String(input || '')
        .split(/[\s,;\n]+/)
        .map((v) => v.trim().toUpperCase())
        .filter((v) => v.length >= 4)
    )
  ).slice(0, 20);
}

export function shipmentStatusKey(status) {
  return `status.${status || 'created'}`;
}

export function eventLabelKey(type) {
  return `event.${type || 'note'}`;
}