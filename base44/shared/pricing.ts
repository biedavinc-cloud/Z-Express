// The billing backend's own copy of the subscription prices. The browser sends a
// plan and a cycle, never an amount: everything that is invoiced is recomputed
// here. Keep these numbers identical to src/lib/pricing.js, which drives what the
// customer is shown.

export const YEARLY_DISCOUNT = 0.15;
export const TRIAL_DAYS = 30;
export const EXTRA_SEAT_MONTHLY = 4;

// The platform bills in US dollars; an agency still prices its own shipments in
// its local currency.
export const BILLING_CURRENCY = 'USD';

export function yearlyPrice(monthly) {
  return Math.round(Number(monthly || 0) * 12 * (1 - YEARLY_DISCOUNT));
}

export const PLANS = [
  { id: 'starter', monthly: 49, seats: 10, currency: BILLING_CURRENCY },
  { id: 'pro', monthly: 89, seats: 50, currency: BILLING_CURRENCY },
  { id: 'enterprise', monthly: 199, seats: 500, currency: BILLING_CURRENCY },
].map((plan) => ({ ...plan, yearly: yearlyPrice(plan.monthly) }));

export const PLAN_IDS = PLANS.map((plan) => plan.id);

export function planById(id) {
  return PLANS.find((plan) => plan.id === id) || null;
}

export const PROVIDERS = {
  paddle: { id: 'paddle', label: 'Paddle', percent: 5, fixed: 0.5, methods: ['card'] },
  flutterwave: {
    id: 'flutterwave',
    label: 'Flutterwave',
    percent: 1.4,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
  },
  paystack: {
    id: 'paystack',
    label: 'Paystack',
    percent: 1.5,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
  },
  korapay: {
    id: 'korapay',
    label: 'Korapay',
    percent: 1.5,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
  },
  payunit: { id: 'payunit', label: 'Payunit', percent: 2.5, methods: ['card', 'mobile_money'] },
};

// Which provider collects each rail. The agency only picks how it pays; the
// provider and its fee stay internal and are never added to the invoice amount.
export const PROVIDER_BY_METHOD = {
  card: 'flutterwave',
  mobile_money: 'flutterwave',
  bank: 'flutterwave',
};

export function providerForMethod(method) {
  return PROVIDERS[PROVIDER_BY_METHOD[method] || 'flutterwave'] || null;
}

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// `total` is what the agency is billed — its subscription alone. The provider's fee
// is our own cost and is computed only so we can record it internally.
export function quote({ planId, cycle = 'monthly', extraSeats = 0, providerId = '' }) {
  const plan = planById(planId);
  if (!plan) return null;

  const extra = Math.max(0, Math.floor(Number(extraSeats) || 0));
  const monthlyList = plan.monthly + extra * EXTRA_SEAT_MONTHLY;
  const yearly = cycle === 'yearly';
  const subtotal = yearly ? yearlyPrice(monthlyList) : round2(monthlyList);
  const listTotal = round2(yearly ? monthlyList * 12 : monthlyList);
  const provider = PROVIDERS[providerId] || null;
  const rawFee = provider ? (subtotal * provider.percent) / 100 + (provider.fixed || 0) : 0;
  const fee = provider ? round2(provider.cap ? Math.min(rawFee, provider.cap) : rawFee) : 0;

  return {
    plan,
    provider,
    cycle,
    seats: plan.seats + extra,
    extraSeats: extra,
    monthlyList: round2(monthlyList),
    listTotal,
    subtotal: round2(subtotal),
    discount: round2(Math.max(0, listTotal - subtotal)),
    fee,
    total: round2(subtotal),
    monthlyEquivalent: round2(yearly ? subtotal / 12 : subtotal),
    currency: plan.currency,
  };
}