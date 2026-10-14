// Payment rails African logistics operators actually collect with — mobile money
// wallets, local gateways, bank transfers, cards and cash networks. The labels are
// data (not UI copy) so each rail is translated inline with the active language,
// and `kind` is what groups them in the pickers.
export const PAYMENT_RAIL_KINDS = [
  { id: 'mobile_money', en: 'Mobile money & wallets', fr: 'Mobile money & portefeuilles' },
  { id: 'gateway', en: 'Payment gateways', fr: 'Passerelles de paiement' },
  { id: 'bank', en: 'Bank transfers', fr: 'Virements bancaires' },
  { id: 'card', en: 'Card payments', fr: 'Paiements par carte' },
  { id: 'cash', en: 'Cash & agents', fr: 'Espèces & agents' },
];

export const PAYMENT_RAILS = [
  // Mobile money & wallets
  { id: 'mtn_momo', kind: 'mobile_money', en: 'MTN Mobile Money', fr: 'MTN Mobile Money' },
  { id: 'orange_money', kind: 'mobile_money', en: 'Orange Money', fr: 'Orange Money' },
  { id: 'moov_money', kind: 'mobile_money', en: 'Moov Money', fr: 'Moov Money' },
  { id: 'wave', kind: 'mobile_money', en: 'Wave', fr: 'Wave' },
  { id: 'mpesa', kind: 'mobile_money', en: 'M-Pesa', fr: 'M-Pesa' },
  { id: 'airtel_money', kind: 'mobile_money', en: 'Airtel Money', fr: 'Airtel Money' },
  { id: 'free_money', kind: 'mobile_money', en: 'Free Money (Senegal)', fr: 'Free Money (Sénégal)' },
  { id: 'wizall', kind: 'mobile_money', en: 'Wizall Money (Senegal)', fr: 'Wizall Money (Sénégal)' },
  { id: 'mixx_by_yas', kind: 'mobile_money', en: 'Mixx by Yas (Tanzania)', fr: 'Mixx by Yas (Tanzanie)' },
  { id: 'halopesa', kind: 'mobile_money', en: 'HaloPesa (Tanzania)', fr: 'HaloPesa (Tanzanie)' },
  { id: 'telebirr', kind: 'mobile_money', en: 'Telebirr (Ethiopia)', fr: 'Telebirr (Éthiopie)' },
  { id: 'mvola', kind: 'mobile_money', en: 'MVola (Madagascar)', fr: 'MVola (Madagascar)' },
  { id: 'ecocash', kind: 'mobile_money', en: 'EcoCash (Zimbabwe)', fr: 'EcoCash (Zimbabwe)' },
  { id: 'afrimoney', kind: 'mobile_money', en: 'Afrimoney (Angola)', fr: 'Afrimoney (Angola)' },
  { id: 'unitel_money', kind: 'mobile_money', en: 'Unitel Money (Angola)', fr: 'Unitel Money (Angola)' },
  { id: 'mpamba', kind: 'mobile_money', en: 'Mpamba (Malawi)', fr: 'Mpamba (Malawi)' },
  { id: 'telecel_cash', kind: 'mobile_money', en: 'Telecel Cash (Ghana)', fr: 'Telecel Cash (Ghana)' },
  { id: 'gmoney', kind: 'mobile_money', en: 'G-Money (Ghana)', fr: 'G-Money (Ghana)' },
  { id: 'airteltigo_money', kind: 'mobile_money', en: 'AirtelTigo Money (Ghana)', fr: 'AirtelTigo Money (Ghana)' },
  { id: 'opay', kind: 'mobile_money', en: 'OPay (Nigeria)', fr: 'OPay (Nigéria)' },
  { id: 'palmpay', kind: 'mobile_money', en: 'PalmPay (Nigeria)', fr: 'PalmPay (Nigéria)' },
  { id: 'paga', kind: 'mobile_money', en: 'Paga (Nigeria)', fr: 'Paga (Nigéria)' },
  { id: 'chipper_cash', kind: 'mobile_money', en: 'Chipper Cash', fr: 'Chipper Cash' },
  { id: 'jumiapay', kind: 'mobile_money', en: 'JumiaPay (Nigeria, Egypt, Kenya)', fr: 'JumiaPay (Nigeria, Égypte, Kenya)' },
  { id: 'fawry', kind: 'mobile_money', en: 'Fawry (Egypt)', fr: 'Fawry (Égypte)' },
  { id: 'flouci', kind: 'mobile_money', en: 'Flouci (Tunisia)', fr: 'Flouci (Tunisie)' },
  { id: 'd17', kind: 'mobile_money', en: 'D17 (Tunisia)', fr: 'D17 (Tunisie)' },
  { id: 'inwi_money', kind: 'mobile_money', en: 'inwi money (Morocco)', fr: 'inwi money (Maroc)' },
  {
    id: 'express_union_mm',
    kind: 'mobile_money',
    en: 'Express Union Mobile Money (Cameroon)',
    fr: 'Express Union Mobile Money (Cameroun)',
  },
  { id: 'wari', kind: 'mobile_money', en: 'Wari (Cameroon, Senegal)', fr: 'Wari (Cameroun, Sénégal)' },
  { id: 'snapscan', kind: 'mobile_money', en: 'SnapScan (South Africa)', fr: 'SnapScan (Afrique du Sud)' },
  { id: 'zapper', kind: 'mobile_money', en: 'Zapper (South Africa)', fr: 'Zapper (Afrique du Sud)' },

  // Payment gateways (cards, mobile money and wallets through one integration)
  { id: 'flutterwave', kind: 'gateway', en: 'Flutterwave', fr: 'Flutterwave' },
  { id: 'paystack', kind: 'gateway', en: 'Paystack', fr: 'Paystack' },
  { id: 'paydunya', kind: 'gateway', en: 'PayDunya', fr: 'PayDunya' },
  { id: 'cinetpay', kind: 'gateway', en: 'CinetPay', fr: 'CinetPay' },
  { id: 'kkiapay', kind: 'gateway', en: 'Kkiapay', fr: 'Kkiapay' },
  { id: 'fedapay', kind: 'gateway', en: 'FedaPay', fr: 'FedaPay' },
  { id: 'semoa', kind: 'gateway', en: 'Semoa', fr: 'Semoa' },
  { id: 'hub2', kind: 'gateway', en: 'Hub2', fr: 'Hub2' },
  { id: 'bizao', kind: 'gateway', en: 'Bizao', fr: 'Bizao' },
  { id: 'notchpay', kind: 'gateway', en: 'Notch Pay (Cameroon)', fr: 'Notch Pay (Cameroun)' },
  { id: 'mesomb', kind: 'gateway', en: 'MeSomb (Cameroon)', fr: 'MeSomb (Cameroun)' },
  { id: 'afrikpay', kind: 'gateway', en: 'Afrikpay (Cameroon)', fr: 'Afrikpay (Cameroun)' },
  { id: 'campay', kind: 'gateway', en: 'Campay (Cameroon)', fr: 'Campay (Cameroun)' },
  { id: 'fapshi', kind: 'gateway', en: 'Fapshi (Cameroon)', fr: 'Fapshi (Cameroun)' },
  { id: 'koree', kind: 'gateway', en: 'Koree (Cameroon)', fr: 'Koree (Cameroun)' },
  { id: 'smobilpay', kind: 'gateway', en: 'Smobilpay (Maviance, Cameroon)', fr: 'Smobilpay (Maviance, Cameroun)' },
  { id: 'payunit', kind: 'gateway', en: 'PayUnit (Cameroon)', fr: 'PayUnit (Cameroun)' },
  { id: 'cellulant_tingg', kind: 'gateway', en: 'Cellulant Tingg', fr: 'Cellulant Tingg' },
  { id: 'pesapal', kind: 'gateway', en: 'Pesapal (East Africa)', fr: 'Pesapal (Afrique de l’Est)' },
  { id: 'dpo_pay', kind: 'gateway', en: 'DPO Pay', fr: 'DPO Pay' },
  { id: 'onafriq', kind: 'gateway', en: 'Onafriq (MFS Africa)', fr: 'Onafriq (MFS Africa)' },
  { id: 'interswitch', kind: 'gateway', en: 'Interswitch (Nigeria)', fr: 'Interswitch (Nigéria)' },
  { id: 'monnify', kind: 'gateway', en: 'Monnify (Nigeria)', fr: 'Monnify (Nigéria)' },
  { id: 'remita', kind: 'gateway', en: 'Remita (Nigeria)', fr: 'Remita (Nigéria)' },
  { id: 'paymob', kind: 'gateway', en: 'Paymob (Egypt)', fr: 'Paymob (Égypte)' },
  { id: 'kashier', kind: 'gateway', en: 'Kashier (Egypt)', fr: 'Kashier (Égypte)' },
  { id: 'yoco', kind: 'gateway', en: 'Yoco (South Africa)', fr: 'Yoco (Afrique du Sud)' },
  { id: 'payfast', kind: 'gateway', en: 'PayFast (South Africa)', fr: 'PayFast (Afrique du Sud)' },
  { id: 'peach_payments', kind: 'gateway', en: 'Peach Payments (South Africa)', fr: 'Peach Payments (Afrique du Sud)' },
  { id: 'paynow', kind: 'gateway', en: 'Paynow (Zimbabwe)', fr: 'Paynow (Zimbabwe)' },
  { id: 'dusupay', kind: 'gateway', en: 'DusuPay', fr: 'DusuPay' },
  { id: 'voguepay', kind: 'gateway', en: 'VoguePay', fr: 'VoguePay' },

  // Bank transfers
  { id: 'bank_transfer', kind: 'bank', en: 'Bank transfer', fr: 'Virement bancaire' },
  { id: 'instant_eft', kind: 'bank', en: 'Instant EFT (South Africa)', fr: 'Instant EFT (Afrique du Sud)' },
  { id: 'pesalink', kind: 'bank', en: 'PesaLink (Kenya)', fr: 'PesaLink (Kenya)' },

  // Cards
  { id: 'card', kind: 'card', en: 'Card payment', fr: 'Paiement par carte' },

  // Cash & agents
  { id: 'cash_on_pickup', kind: 'cash', en: 'Cash at pickup', fr: 'Espèces à l’enlèvement' },
  { id: 'cash_on_delivery', kind: 'cash', en: 'Cash on delivery', fr: 'Espèces à la livraison' },
  { id: 'wafacash', kind: 'cash', en: 'Wafacash (Morocco)', fr: 'Wafacash (Maroc)' },
  { id: 'cash_plus', kind: 'cash', en: 'Cash Plus (Morocco)', fr: 'Cash Plus (Maroc)' },
  { id: 'mukuru', kind: 'cash', en: 'Mukuru (Southern Africa)', fr: 'Mukuru (Afrique australe)' },
];

export const DEFAULT_RAIL = 'mtn_momo';

export const PAYMENT_STATUSES = [
  { id: 'unpaid', en: 'Unpaid', fr: 'Non payé' },
  { id: 'awaiting_verification', en: 'To verify', fr: 'À vérifier' },
  { id: 'paid', en: 'Paid', fr: 'Payé' },
  { id: 'cod_pending', en: 'Collect on delivery', fr: 'Paiement à la livraison' },
];

export const PAYMENT_STATUS_CLASS = {
  unpaid: 'bg-secondary text-muted-foreground',
  awaiting_verification: 'bg-accent/15 text-accent',
  paid: 'bg-emerald-100 text-emerald-800',
  cod_pending: 'bg-primary/10 text-primary',
};

export const railById = (id) => PAYMENT_RAILS.find((rail) => rail.id === id) || null;

export const railLabel = (id, lang) => {
  const rail = railById(id);
  if (!rail) return id || '—';
  return rail[lang] || rail.en;
};

export const paymentStatusLabel = (id, lang) => {
  const status = PAYMENT_STATUSES.find((item) => item.id === id);
  if (!status) return id || '—';
  return status[lang] || status.en;
};