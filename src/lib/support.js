// Single source for the published support and customer-service details, so the
// landing block, the footer, the careers page and the policy pages never drift.

// Customer service: the address a customer writes to about a shipment or invoice.
export const SUPPORT_EMAIL = 'express@zanldo.com';

// Platform support: platform, account and partnership questions.
export const PLATFORM_EMAIL = 'support@liafrik.com';

// Customer-service line. The last two digits still have to be confirmed, so the
// number is published as supplied and no call link is generated from it yet.
export const SUPPORT_PHONE = '+971 50 385 72 XX';

export const SUPPORT_ADDRESS = 'Bonanjo, Douala — Cameroon';

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
export const PLATFORM_MAILTO = `mailto:${PLATFORM_EMAIL}`;

export function supportMailto(subject) {
  return `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}`;
}