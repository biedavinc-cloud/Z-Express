// Recognises the tracking formats of the international carriers and marketplaces
// customers already buy from, so a number bought on Amazon can be followed from
// this app as well as on the carrier's own page.
const PROVIDERS = [
  {
    id: 'amazon',
    en: 'Amazon',
    fr: 'Amazon',
    test: /^TBA\d{9,15}$/i,
    url: (n) => `https://www.amazon.com/progress-tracker/package/?trackingId=${encodeURIComponent(n)}`,
  },
  {
    id: 'ups',
    en: 'UPS',
    fr: 'UPS',
    test: /^1Z[0-9A-Z]{16}$/i,
    url: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  },
  {
    id: 'fedex',
    en: 'FedEx',
    fr: 'FedEx',
    test: /^\d{12}$|^\d{15}$/,
    url: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  },
  {
    id: 'usps',
    en: 'USPS',
    fr: 'USPS',
    test: /^9[0-9]{19,21}$|^[A-Z]{2}\d{9}US$/i,
    url: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  },
  {
    id: 'dhl',
    en: 'DHL',
    fr: 'DHL',
    test: /^JJD\d{9,20}$|^\d{10}$/i,
    url: (n) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
  },
  {
    id: 'laposte',
    en: 'La Poste / Colissimo',
    fr: 'La Poste / Colissimo',
    test: /^[A-Z]{2}\d{9}(FR|CM|SN|CI)$/i,
    url: (n) => `https://www.laposte.fr/outils/track-a-parcel?code=${encodeURIComponent(n)}`,
  },
  {
    id: 'aramex',
    en: 'Aramex',
    fr: 'Aramex',
    test: /^\d{9,11}$/,
    url: (n) => `https://www.aramex.com/us/en/track/results?ShipmentNumber=${encodeURIComponent(n)}`,
  },
  {
    id: 'gls',
    en: 'GLS',
    fr: 'GLS',
    test: /^[A-Z0-9]{11,13}$/i,
    url: (n) => `https://gls-group.com/track?match=${encodeURIComponent(n)}`,
  },
];

// Express network numbers are handled by the app itself — never sent out.
const isOwnNetwork = (number) => /^ZE[A-Z0-9]{4,}/i.test(String(number || '').trim());

export function detectProvider(number) {
  const value = String(number || '').trim();
  if (!value || isOwnNetwork(value)) return null;
  const provider = PROVIDERS.find((item) => item.test.test(value));
  if (!provider) return null;
  return { id: provider.id, label: provider.en, url: provider.url(value) };
}

export function providerLabel(provider, lang) {
  if (!provider) return null;
  const source = PROVIDERS.find((item) => item.id === provider.id);
  if (!source) return provider.label;
  return source[lang] || source.en;
}