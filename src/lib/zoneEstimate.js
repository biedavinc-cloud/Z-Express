// Mirrors the server-side rate engine so the zone form can preview a price.
// The authoritative amount is always recalculated on the server at booking.
export function estimateZoneBase(zone, weightKg, distanceKm) {
  const base = Number(zone.base_rate) || 0;
  const kg = Number(weightKg) || 0;
  let price;
  switch (zone.pricing_model) {
    case 'flat':
      price = base;
      break;
    case 'distance':
      price = base + (Number(zone.per_km) || 0) * (Number(distanceKm) || 0);
      break;
    case 'tiered': {
      const tiers = (zone.weight_tiers || []).slice().sort((a, b) => (a.max_kg || 0) - (b.max_kg || 0));
      const tier = tiers.find((item) => kg <= (item.max_kg || 0));
      price = tier ? Number(tier.rate) || 0 : base + (Number(zone.per_kg) || 0) * kg;
      break;
    }
    default:
      price = base + (Number(zone.per_kg) || 0) * kg;
  }
  return Math.round(Math.max(price, Number(zone.min_charge) || 0) * 100) / 100;
}