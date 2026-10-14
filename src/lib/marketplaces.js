// Sales channels an agency can plug into the platform. Each one either pushes
// its orders to the agency's inbound webhook, or receives the agency as a
// carrier through the public API.
export const MARKETPLACES = [
  { id: 'shopify', label: 'Shopify' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'magento', label: 'Magento' },
  { id: 'prestashop', label: 'PrestaShop' },
  { id: 'wix', label: 'Wix Stores' },
  { id: 'jumia', label: 'Jumia' },
  { id: 'amazon', label: 'Amazon Seller' },
  { id: 'ebay', label: 'eBay' },
  { id: 'etsy', label: 'Etsy' },
  { id: 'custom', label: 'Other marketplace' },
];

export const MARKETPLACE_MODES = ['orders_in', 'carrier_account'];

export function marketplaceName(id) {
  return MARKETPLACES.find((m) => m.id === id)?.label || 'Marketplace';
}

export function marketplaceEndpoint(origin, token) {
  return `${origin}/functions/marketplaceOrder?token=${token || ''}`;
}

export function generateInboundToken() {
  return `mkt_${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}