// Single source for the Z. Express mark so the header, the portal and the
// onboarding stay in sync.
export const BRAND_LOGO = '/images/z-express-logo.png';

// Z. Express is a product of Zanldo and is powered by Liafrik Tech.
export const ZANLDO = { name: 'Zanldo', url: 'https://zanldo.com' };
export const LIAFRIK = { name: 'Liafrik Tech', url: 'https://liafrik.com' };

// Wordmark shown next to the logo lockup.
export const BRAND_NAME = 'Express';

// Product icon for the rate calculator, used where the tool is shown as an app tile.
export const RATE_CALC_ICON =
  '/images/262d6787f_interest.png';

// Product icon for the help & support centre.
export const HELP_CENTER_ICON =
  '/images/cb062ea48_customer-support.png';

// Product icon for the business & corporate portal.
export const BUSINESS_ICON =
  '/images/9955ae648_cooperation.png';

// Product icon for sending a shipment.
export const SEND_SHIPMENT_ICON =
  '/images/6e53d4164_tracking.png';

// Product icon for freight forwarding (air, sea and road).
export const FREIGHT_ICON =
  '/images/67b98106d_freight.png';

// Product icon for supply chain & warehousing.
export const SUPPLY_CHAIN_ICON =
  '/images/82b326c64_supply-chain-management.png';

// Product icon for last-mile fulfilment.
export const LAST_MILE_ICON =
  '/images/7fb58e7d7_shipment-tracking.png';

// Product icon for express delivery.
export const EXPRESS_ICON =
  '/images/526d80bbc_fast-shipping.png';

// Public address the agency platform is served from — the base merchants copy
// for the API and the one marketplaces register their inbound webhooks against.
export const APP_DOMAIN = 'https://express.zanldo.com';

// Base address of the backend functions that merchants and marketplaces call
// (merchant API, marketplace orders). Override with VITE_FUNCTIONS_URL when the
// functions are served from a custom domain.
export const FUNCTIONS_URL = (
  import.meta.env.VITE_FUNCTIONS_URL ||
  (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : `${APP_DOMAIN}/functions`)
).replace(/\/+$/, '');
