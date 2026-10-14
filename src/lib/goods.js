// Nature of the parcel — used to classify freight and to warn about restricted
// goods. Labels are data, translated inline with the active language.
export const GOODS_CATEGORIES = [
  { id: 'documents', en: 'Documents & letters', fr: 'Documents & courriers' },
  { id: 'electronics', en: 'Electronics', fr: 'Électronique' },
  { id: 'clothing', en: 'Clothing & textiles', fr: 'Vêtements & textile' },
  { id: 'food', en: 'Food & beverages', fr: 'Alimentation' },
  { id: 'cosmetics', en: 'Cosmetics & beauty', fr: 'Cosmétiques & beauté' },
  { id: 'pharma', en: 'Pharmacy & health', fr: 'Pharmacie & santé' },
  { id: 'auto_parts', en: 'Auto parts', fr: 'Pièces détachées auto' },
  { id: 'home', en: 'Home & furniture', fr: 'Maison & mobilier' },
  { id: 'other', en: 'Other', fr: 'Autre' },
];

export const DEFAULT_GOODS = 'other';

export const goodsLabel = (id, lang) => {
  const goods = GOODS_CATEGORIES.find((item) => item.id === id);
  if (!goods) return id || '—';
  return goods[lang] || goods.en;
};