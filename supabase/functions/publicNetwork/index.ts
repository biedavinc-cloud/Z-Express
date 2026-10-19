import { createClientFromRequest, serve } from '../_shared/platform.ts';

// The public network map is drawn from the offices the agencies really registered,
// so a hub created in a portal shows up on the site on its own. Only active
// agencies are exposed, and only the fields a visitor may see: no address, no
// phone, no internal identifier.

const HUB_TYPES = ['hub', 'sorting_center', 'agency', 'pickup_point'];

const text = (value, max = 120) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);

const coordinate = (value, limit) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return null;
  if (Math.abs(number) > limit) return null;
  return Math.round(number * 10000) / 10000;
};

const rowsOf = (result) => (Array.isArray(result) ? result : (result && result.items) || []);

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const service = client.asServiceRole;

    const [tenants, hubs, zones] = await Promise.all([
      service.entities.Tenant.filter({ status: 'active' }, { limit: 200 }),
      service.entities.Hub.filter({}, { limit: 400 }),
      service.entities.Zone.filter({}, { limit: 400 }),
    ]);

    const active = new Map(rowsOf(tenants).map((tenant) => [tenant.id, tenant]));

    const offices = [];
    for (const hub of rowsOf(hubs)) {
      if (hub.status === 'inactive') continue;
      const carrier = active.get(hub.tenant_id);
      if (!carrier) continue;
      const lat = coordinate(hub.lat, 90);
      const lng = coordinate(hub.lng, 180);
      if (lat === null || lng === null) continue;
      offices.push({
        id: hub.id,
        name: text(hub.name, 90),
        city: text(hub.city, 60),
        country: text(hub.country, 60),
        type: HUB_TYPES.includes(hub.type) ? hub.type : 'agency',
        lat,
        lng,
        carrier: text(carrier.name, 80),
        carrier_logo: text(carrier.logo_url, 300),
      });
      if (offices.length >= 300) break;
    }

    // Reach: every country an active agency serves — a registered office, or a
    // published rate card for that country. This is what makes the network
    // pan-African rather than just the cities holding a warehouse.
    const countries = new Set();
    for (const office of offices) if (office.country) countries.add(office.country.toLowerCase());
    for (const zone of rowsOf(zones)) {
      if (zone.active === false) continue;
      if (!active.has(zone.tenant_id)) continue;
      if (zone.country) countries.add(String(zone.country).toLowerCase());
    }

    const cities = new Set(offices.map((office) => office.city.toLowerCase()).filter(Boolean));

    return Response.json({
      offices,
      totals: {
        offices: offices.length,
        hubs: offices.filter((office) => office.type === 'hub').length,
        sorting: offices.filter((office) => office.type === 'sorting_center').length,
        agencies: offices.filter((office) => office.type === 'agency' || office.type === 'pickup_point').length,
        cities: cities.size,
        countries: countries.size,
        carriers: new Set(offices.map((office) => office.carrier).filter(Boolean)).size,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
