// Subscription pricing for the platform: the plan table, the annual discount and
// the transaction fees of the payment providers we collect with.
//
// The billing backend keeps its own copy of these numbers
// (base44/shared/pricing.ts) because the browser is never trusted with the amount
// that is actually charged. Change a price here and change it there too.

export const YEARLY_DISCOUNT = 0.15; // paying a full year up front saves 15%
export const TRIAL_DAYS = 30; // one month free, no card charged up front
export const EXTRA_SEAT_MONTHLY = 4; // per additional user, on top of plan seats

// The platform's own currency. Subscriptions and every price the platform
// advertises are published in US dollars, whatever currency an agency bills its
// own shipments in — those rate cards stay in the agency's local currency.
export const BILLING_CURRENCY = 'USD';

export function yearlyPrice(monthly) {
  return Math.round(Number(monthly || 0) * 12 * (1 - YEARLY_DISCOUNT));
}

export const PLANS = [
  { id: 'starter', monthly: 49, seats: 10, currency: BILLING_CURRENCY },
  { id: 'pro', monthly: 89, seats: 50, currency: BILLING_CURRENCY, popular: true },
  { id: 'enterprise', monthly: 199, seats: 500, currency: BILLING_CURRENCY },
].map((plan) => ({ ...plan, yearly: yearlyPrice(plan.monthly) }));

export const PLAN_IDS = PLANS.map((plan) => plan.id);

export function planById(id) {
  return PLANS.find((plan) => plan.id === id) || PLANS[0];
}

// The payment service providers the platform collects subscriptions with. The
// percentages are each provider's published rate, used for the estimate shown in
// the calculator and confirmed by the provider at checkout.
export const PAYMENT_PROVIDERS = [
  {
    id: 'paddle',
    label: 'Paddle',
    en: 'Cards worldwide · merchant of record (VAT handled)',
    fr: 'Cartes mondiales · marchand de référence (TVA gérée)',
    percent: 5,
    fixed: 0.5,
    methods: ['card'],
    payout: 'T+7',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    en: 'Cards, mobile money & bank across 30+ African markets',
    fr: 'Cartes, mobile money et banque sur plus de 30 marchés africains',
    percent: 1.4,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
    payout: 'T+1',
  },
  {
    id: 'paystack',
    label: 'Paystack',
    en: 'Cards, mobile money & bank — Nigeria, Ghana, Kenya, South Africa',
    fr: 'Cartes, mobile money et banque — Nigeria, Ghana, Kenya, Afrique du Sud',
    percent: 1.5,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
    payout: 'T+2',
  },
  {
    id: 'korapay',
    label: 'Korapay',
    en: 'Cards, mobile money & transfers across Africa',
    fr: 'Cartes, mobile money et transferts à travers l’Afrique',
    percent: 1.5,
    cap: 1.3,
    methods: ['card', 'mobile_money', 'bank'],
    payout: 'T+1',
  },
  {
    id: 'payunit',
    label: 'Payunit',
    en: 'Cards & mobile money — Cameroon, CEMAC',
    fr: 'Cartes et mobile money — Cameroun, CEMAC',
    percent: 2.5,
    methods: ['card', 'mobile_money'],
    payout: 'T+3',
  },
];

export const PAYMENT_METHODS = ['card', 'mobile_money', 'bank'];

// Which provider collects each payment rail. The customer only chooses how they pay
// — the provider, its rate and its fee are ours to manage and are never billed to
// them. Move a rail to another provider here (and in base44/shared/pricing.ts) and
// nothing customer-facing changes.
export const PROVIDER_BY_METHOD = {
  card: 'flutterwave',
  mobile_money: 'flutterwave',
  bank: 'flutterwave',
};

export function providerForMethod(method) {
  return providerById(PROVIDER_BY_METHOD[method] || 'flutterwave');
}

export function providerById(id) {
  return PAYMENT_PROVIDERS.find((provider) => provider.id === id) || null;
}

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function processingFee(providerId, amount) {
  const provider = typeof providerId === 'string' ? providerById(providerId) : providerId;
  if (!provider || !(amount > 0)) return 0;
  const raw = (amount * provider.percent) / 100 + (provider.fixed || 0);
  return round2(provider.cap ? Math.min(raw, provider.cap) : raw);
}

// One place that turns a plan + cycle + extra users into the exact figures shown on
// the pricing table, the calculator and the checkout form. `total` is the
// subscription and nothing else: the provider's fee is our own cost, so `fee` is
// only ever used for our accounting, never added to what the customer pays.
export function quote({ planId, cycle = 'monthly', extraSeats = 0, providerId = '' } = {}) {
  const plan = planById(planId);
  const extra = Math.max(0, Math.floor(Number(extraSeats) || 0));
  const monthlyList = plan.monthly + extra * EXTRA_SEAT_MONTHLY;
  const yearly = cycle === 'yearly';
  const subtotal = yearly ? yearlyPrice(monthlyList) : round2(monthlyList);
  const listTotal = round2(yearly ? monthlyList * 12 : monthlyList);
  const provider = providerById(providerId);
  const fee = processingFee(provider, subtotal);

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