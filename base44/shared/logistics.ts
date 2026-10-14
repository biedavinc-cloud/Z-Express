// Shared logistics logic used by every quoting / shipment backend function.
// Never imported from the frontend.

export const VOLUMETRIC_DIVISOR = 5000;

const GOODS_CATEGORIES = [
  "documents",
  "electronics",
  "clothing",
  "food",
  "cosmetics",
  "pharma",
  "auto_parts",
  "home",
  "other",
];

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function chargeableWeight(weightKg, dimensions) {
  const actual = Number(weightKg) || 0;
  const l = Number(dimensions && dimensions.l) || 0;
  const w = Number(dimensions && dimensions.w) || 0;
  const h = Number(dimensions && dimensions.h) || 0;
  const volumetric = l > 0 && w > 0 && h > 0 ? (l * w * h) / VOLUMETRIC_DIVISOR : 0;
  const chargeable = Math.max(actual, volumetric, 0.5);
  return { actual, volumetric: round2(volumetric), chargeable: round2(chargeable) };
}

export function basePriceFor(zone, chargeableKg, distanceKm) {
  const z = zone || {};
  const base = Number(z.base_rate) || 0;
  const kg = Number(chargeableKg) || 0;
  let price;
  switch (z.pricing_model) {
    case "flat":
      price = base;
      break;
    case "distance":
      price = base + (Number(z.per_km) || 0) * (Number(distanceKm) || 0);
      break;
    case "tiered": {
      const tiers = (z.weight_tiers || []).slice().sort((a, b) => (a.max_kg || 0) - (b.max_kg || 0));
      const tier = tiers.find((t) => kg <= (t.max_kg || 0));
      price = tier ? Number(tier.rate) || 0 : base + (Number(z.per_kg) || 0) * kg;
      break;
    }
    default:
      price = base + (Number(z.per_kg) || 0) * kg;
  }
  return round2(Math.max(price, Number(z.min_charge) || 0));
}

export function surchargeLines(subtotal, surcharges, ctx) {
  const lines = [];
  let total = 0;
  const c = ctx || {};
  for (const s of surcharges || []) {
    if (s.active === false) continue;
    if (s.applies_to === "express" && c.serviceType !== "express") continue;
    if (s.applies_to === "cod" && !c.isCod) continue;
    if (s.type === "remote_area" && !c.remoteArea) continue;
    // Rule conditions configured on the surcharge settings page.
    const basis = s.basis || "always";
    const threshold = Number(s.threshold) || 0;
    if (basis === "weight" && !((Number(c.chargeableKg) || 0) > threshold)) continue;
    if (basis === "volumetric" && !((Number(c.volumetricKg) || 0) > threshold)) continue;
    if (basis === "zone" && (!s.zone_id || s.zone_id !== c.zoneId)) continue;
    const amount = s.mode === "percent" ? round2(subtotal * ((Number(s.amount) || 0) / 100)) : round2(s.amount);
    if (amount > 0) {
      total += amount;
      lines.push({ name: s.name, type: s.type, mode: s.mode, amount });
    }
  }
  return { total: round2(total), lines };
}

export function pickZone(zones, destCity, destCountry) {
  const city = (destCity || "").trim().toLowerCase();
  const country = (destCountry || "").trim().toLowerCase();
  const inCountry = (zones || []).filter((z) => (z.country || "").trim().toLowerCase() === country);
  if (!inCountry.length) return null;
  if (city) {
    const hit = inCountry.find((z) => (z.cities || []).some((c) => (c || "").trim().toLowerCase() === city));
    if (hit) return hit;
    const remote = inCountry.find((z) => z.remote_area === true);
    return remote || inCountry[0];
  }
  return inCountry.find((z) => !(z.cities || []).length) || inCountry[0];
}

// Accepts both the quoting vocabulary (dest_city) and the booking vocabulary
// (receiver_city) so the public form, the merchant API and every marketplace
// connection price the same lane from the same fields.
export function normaliseQuoteInput(body) {
  const p = body || {};
  return {
    origin_country: String(p.origin_country || p.sender_country || "").trim().slice(0, 60),
    origin_city: String(p.origin_city || p.sender_city || "").trim().slice(0, 60),
    dest_country: String(p.dest_country || p.receiver_country || "").trim().slice(0, 60),
    dest_city: String(p.dest_city || p.receiver_city || "").trim().slice(0, 60),
    weight_kg: Math.min(Math.max(Number(p.weight_kg) || 0, 0.1), 5000),
    dimensions: p.dimensions || {},
    service_type: ["express", "standard", "freight", "fulfillment"].includes(p.service_type)
      ? p.service_type
      : "standard",
    payment_mode: p.payment_mode === "cod" ? "cod" : "prepaid",
    cod_amount: Math.min(Math.max(Number(p.cod_amount) || 0, 0), 5000000),
    distance_km: Math.min(Math.max(Number(p.distance_km) || 0, 0), 20000),
  };
}

export function validateQuoteInput(p) {
  if (!p.dest_country) return "dest_country is required";
  if (!p.dest_city) return "dest_city is required";
  if (!(p.weight_kg > 0)) return "weight_kg must be greater than 0";
  return null;
}

// Cross-tenant rate engine: active tenants serving the destination lane.
export async function buildQuotes(service, params) {
  const p = normaliseQuoteInput(params);
  const { chargeable, volumetric } = chargeableWeight(p.weight_kg, p.dimensions);
  const isCod = p.payment_mode === "cod";

  const [tenants, zones] = await Promise.all([
    service.entities.Tenant.filter({ status: "active" }),
    service.entities.Zone.filter({ active: true, country: p.dest_country }),
  ]);
  if (!tenants.length || !zones.length) return [];

  const tenantIds = Array.from(new Set(zones.map((z) => z.tenant_id))).slice(0, 25);
  const surcharges = await service.entities.Surcharge.filter({ tenant_id: { $in: tenantIds } });

  const quotes = [];
  for (const tenant of tenants) {
    const tenantZones = zones.filter((z) => z.tenant_id === tenant.id);
    const zone = pickZone(tenantZones, p.dest_city, p.dest_country);
    if (!zone) continue;
    const base = basePriceFor(zone, chargeable, p.distance_km);
    const remoteArea = zone.remote_area === true;
    const sur = surchargeLines(base, surcharges.filter((s) => s.tenant_id === tenant.id), {
      serviceType: p.service_type,
      isCod,
      remoteArea,
      chargeableKg: chargeable,
      volumetricKg: volumetric,
      zoneId: zone.id,
    });
    const etaDays = Math.max(1, Number(zone.eta_days) || 2) - (p.service_type === "express" ? 1 : 0);
    quotes.push({
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      tenant_logo: tenant.logo_url || "",
      tenant_city: tenant.city || "",
      tenant_country: tenant.country || "",
      zone_id: zone.id,
      zone_name: zone.name,
      pricing_model: zone.pricing_model,
      service_type: p.service_type,
      payment_mode: p.payment_mode,
      currency: zone.currency || tenant.currency || "USD",
      chargeable_weight_kg: chargeable,
      volumetric_weight_kg: volumetric,
      base_price: base,
      surcharge_total: sur.total,
      surcharge_lines: sur.lines,
      total_amount: round2(base + sur.total),
      eta_days: etaDays,
      cod_amount: isCod ? p.cod_amount : 0,
    });
  }
  return quotes.sort((a, b) => a.total_amount - b.total_amount).slice(0, 8);
}

// Tracking numbers and delivery codes are access tokens, so they come from the
// platform CSPRNG — Math.random() is predictable and must never mint them.
function randomDigits(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

export function trackingNumberFor(prefix) {
  const clean = (prefix || "ZX").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "ZX";
  return `ZE${clean}${randomDigits(8)}`;
}

export function waybillNumberFor() {
  return `WB${randomDigits(9)}`;
}

export function deliveryOtp() {
  return randomDigits(6);
}

function scopeEmails(tenant) {
  const emails = [tenant.owner_email, ...(tenant.member_emails || [])].filter(Boolean);
  return Array.from(new Set(emails));
}

export function validateShipmentInput(body) {
  const p = body || {};
  const required = [
    ["tenant_id", "tenant_id is required"],
    ["sender_name", "sender_name is required"],
    ["sender_phone", "sender_phone is required"],
    ["receiver_name", "receiver_name is required"],
    ["receiver_phone", "receiver_phone is required"],
    ["receiver_city", "receiver_city is required"],
    ["receiver_country", "receiver_country is required"],
    ["receiver_address", "receiver_address is required"],
  ];
  for (const [field, message] of required) {
    if (!String(p[field] || "").trim()) return message;
  }
  const weight = Number(p.weight_kg) || 0;
  if (weight <= 0 || weight > 5000) return "weight_kg must be between 0 and 5000";
  if (Number(p.cod_amount) > 5000000) return "cod_amount is too large";
  return null;
}

// A store or channel that retries after a timeout must get the parcel it already
// registered, not a second one for the same order.
export async function findShipmentByRef(service, tenantId, merchantRef) {
  const ref = String(merchantRef || "").trim().slice(0, 80);
  if (!ref) return null;
  const rows = await service.entities.Shipment.filter(
    { tenant_id: tenantId, merchant_ref: ref },
    { sort: "-created_date", limit: 1 }
  );
  const items = Array.isArray(rows) ? rows : rows.items || [];
  return items[0] || null;
}

// Creates a shipment with server-side pricing. Used by the public form (no login)
// and by the merchant API, so pricing can never be spoofed by the client.
export async function createShipmentRecord(service, tenant, payload, source) {
  const p = normaliseQuoteInput(payload);
  const { chargeable, volumetric } = chargeableWeight(p.weight_kg, p.dimensions);
  const isCod = p.payment_mode === "cod";
  const goodsCategory = GOODS_CATEGORIES.includes(payload.goods_category) ? payload.goods_category : "other";
  const paymentMethod = String(payload.payment_method || "").slice(0, 40);
  const paymentMethodLabel = String(payload.payment_method_label || "").slice(0, 140);
  // A parcel paid by mobile money or transfer stays unconfirmed until the agency
  // checks the money landed; cash on delivery is collected at the door.
  const paymentStatus = isCod ? "cod_pending" : paymentMethod ? "awaiting_verification" : "unpaid";

  const zones = await service.entities.Zone.filter({ tenant_id: tenant.id, active: true });
  const zone = pickZone(zones, p.dest_city, p.dest_country);
  const base = zone ? basePriceFor(zone, chargeable, p.distance_km) : 0;
  const surcharges = await service.entities.Surcharge.filter({ tenant_id: tenant.id, active: true });
  const sur = surchargeLines(base, surcharges, {
    serviceType: p.service_type,
    isCod,
    remoteArea: zone ? zone.remote_area === true : false,
    chargeableKg: chargeable,
    volumetricKg: volumetric,
    zoneId: zone ? zone.id : "",
  });

  const tracking = trackingNumberFor(tenant.tracking_prefix || tenant.name);
  const etaDays = Math.max(1, Number(zone && zone.eta_days) || 2) - (p.service_type === "express" ? 1 : 0);
  const etaDate = new Date(Date.now() + etaDays * 86400000).toISOString().slice(0, 10);

  const record = {
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    tracking_number: tracking,
    waybill_number: waybillNumberFor(),
    merchant_ref: String(payload.merchant_ref || "").slice(0, 80),
    source,
    merchant_email: String(payload.merchant_email || "").trim().toLowerCase().slice(0, 120),
    sender_name: String(payload.sender_name).slice(0, 120),
    sender_phone: String(payload.sender_phone).slice(0, 40),
    sender_email: String(payload.sender_email || "").slice(0, 120),
    sender_country: String(payload.sender_country || p.origin_country || "").slice(0, 60),
    sender_city: String(payload.sender_city || p.origin_city || "").slice(0, 60),
    sender_address: String(payload.sender_address || "").slice(0, 400),
    sender_lat: Number(payload.sender_lat) || undefined,
    sender_lng: Number(payload.sender_lng) || undefined,
    receiver_name: String(payload.receiver_name).slice(0, 120),
    receiver_phone: String(payload.receiver_phone).slice(0, 40),
    receiver_email: String(payload.receiver_email || "").slice(0, 120),
    receiver_country: p.dest_country,
    receiver_city: p.dest_city,
    receiver_address: String(payload.receiver_address).slice(0, 400),
    receiver_lat: Number(payload.receiver_lat) || undefined,
    receiver_lng: Number(payload.receiver_lng) || undefined,
    receiver_what3words: String(payload.receiver_what3words || "").slice(0, 80),
    weight_kg: Number(payload.weight_kg) || 0.5,
    volumetric_weight_kg: volumetric,
    chargeable_weight_kg: chargeable,
    dimensions: payload.dimensions || {},
    pieces: Math.min(Math.max(Number(payload.pieces) || 1, 1), 500),
    declared_value: Math.max(Number(payload.declared_value) || 0, 0),
    description: String(payload.description || "").slice(0, 300),
    goods_category: goodsCategory,
    service_type: p.service_type,
    payment_mode: p.payment_mode,
    payment_method: paymentMethod,
    payment_method_label: paymentMethodLabel,
    payment_status: paymentStatus,
    cod_amount: isCod ? p.cod_amount : 0,
    currency: (zone && zone.currency) || tenant.currency || "USD",
    base_price: base,
    surcharge_total: sur.total,
    total_amount: round2(base + sur.total),
    status: "created",
    zone_id: zone ? zone.id : "",
    origin_hub_id: String(payload.origin_hub_id || ""),
    destination_hub_id: String(payload.destination_hub_id || ""),
    delivery_otp: deliveryOtp(),
    eta_date: etaDate,
    payment_reference: tracking,
    paid_at: "",
    webhook_url: String(payload.webhook_url || "").slice(0, 300),
    notes: String(payload.notes || "").slice(0, 500),
    member_emails: scopeEmails(tenant),
  };

  const shipment = await service.entities.Shipment.create(record);
  await service.entities.ShipmentEvent.create({
    tenant_id: tenant.id,
    shipment_id: shipment.id,
    tracking_number: tracking,
    status: "created",
    event_type: "created",
    location: `${record.sender_city}${record.sender_city ? ", " : ""}${record.sender_country}`,
    note: "Shipment registered — awaiting pickup",
    occurred_at: new Date().toISOString(),
    visible_public: true,
    member_emails: record.member_emails,
  });

  // The agency's own endpoints are notified here, which covers the public form,
  // the merchant API and the marketplace bridge in one place.
  await dispatchWebhooks(service, {
    tenant_id: tenant.id,
    event: "shipment.created",
    payload: {
      tracking_number: tracking,
      waybill_number: record.waybill_number,
      status: "created",
      service_type: record.service_type,
      payment_mode: record.payment_mode,
      payment_method: record.payment_method,
      payment_status: record.payment_status,
      goods_category: record.goods_category,
      cod_amount: record.cod_amount,
      total_amount: record.total_amount,
      currency: record.currency,
      merchant_ref: record.merchant_ref,
      receiver_city: record.receiver_city,
      receiver_country: record.receiver_country,
      eta_date: record.eta_date,
      source,
    },
    member_emails: record.member_emails,
    payload_ref: tracking,
  });

  if (isCod && record.cod_amount > 0) {
    await service.entities.CodEntry.create({
      tenant_id: tenant.id,
      shipment_id: shipment.id,
      tracking_number: tracking,
      merchant_email: record.merchant_email,
      amount: record.cod_amount,
      currency: record.currency,
      status: "pending",
      member_emails: record.member_emails,
    });
  }

  return shipment;
}

// Coordinates reaching a public tracking page are rounded: the parcel's live
// position to ~100 m, the pickup and delivery points to ~1 km. A visitor holding
// a tracking number therefore sees the journey, never a doorstep.
function coarse(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return undefined;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

export function publicShipmentView(s) {
  return {
    tracking_number: s.tracking_number,
    waybill_number: s.waybill_number,
    tenant_name: s.tenant_name,
    status: s.status,
    service_type: s.service_type,
    payment_mode: s.payment_mode,
    payment_method: s.payment_method,
    payment_status: s.payment_status,
    goods_category: s.goods_category,
    cod_amount: s.cod_amount,
    currency: s.currency,
    weight_kg: s.weight_kg,
    pieces: s.pieces,
    eta_date: s.eta_date,
    sender_city: s.sender_city,
    sender_country: s.sender_country,
    receiver_city: s.receiver_city,
    receiver_country: s.receiver_country,
    delivery_attempts: s.delivery_attempts,
    last_ndr_reason: s.last_ndr_reason,
    pod_at: s.pod_at,
    pod_recipient_name: s.pod_recipient_name,
    sender_lat: coarse(s.sender_lat, 2),
    sender_lng: coarse(s.sender_lng, 2),
    receiver_lat: coarse(s.receiver_lat, 2),
    receiver_lng: coarse(s.receiver_lng, 2),
    current_lat: coarse(s.current_lat, 3),
    current_lng: coarse(s.current_lng, 3),
    last_gps_at: s.last_gps_at,
    courier_name: s.courier_name,
  };
}

// `options.tenantId` scopes the lookup to one agency, which is what keeps a
// merchant API key from ever reading another tenant's parcels.
export async function trackNumbers(service, numbers, options) {
  const scope = options && options.tenantId ? { tenant_id: options.tenantId } : {};
  const clean = Array.from(
    new Set(
      (numbers || [])
        .map((n) => String(n || "").trim().toUpperCase())
        .filter((n) => n.length >= 4 && n.length <= 40)
    )
  ).slice(0, 20);
  if (!clean.length) return [];

  const [byTracking, byWaybill] = await Promise.all([
    service.entities.Shipment.filter({ ...scope, tracking_number: { $in: clean } }),
    service.entities.Shipment.filter({ ...scope, waybill_number: { $in: clean } }),
  ]);
  const found = [...byTracking, ...byWaybill];
  const ids = found.map((s) => s.id);
  const events = ids.length
    ? await service.entities.ShipmentEvent.filter({ shipment_id: { $in: ids } })
    : [];

  // The public tracking page carries the carrying agency's own brand, so its logo
  // and colour travel with the result instead of being read from the browser.
  const tenantIds = Array.from(new Set(found.map((s) => s.tenant_id).filter(Boolean)));
  const partners = tenantIds.length ? await service.entities.Tenant.filter({ id: { $in: tenantIds } }) : [];
  const brandById = new Map(
    (partners.items || partners).map((t) => [
      t.id,
      { name: t.name || "", logo_url: t.logo_url || "", brand_color: t.brand_color || "" },
    ])
  );

  return found.map((s) => ({
    shipment: publicShipmentView(s),
    partner: brandById.get(s.tenant_id) || null,
    events: events
      .filter((e) => e.shipment_id === s.id && e.visible_public !== false)
      .sort((a, b) => String(b.occurred_at || "").localeCompare(String(a.occurred_at || "")))
      .map((e) => ({
        status: e.status,
        event_type: e.event_type,
        location: e.location,
        hub_name: e.hub_name,
        note: e.note,
        occurred_at: e.occurred_at,
        lat: coarse(e.lat, 3),
        lng: coarse(e.lng, 3),
      })),
  }));
}

// Keeps a background promise alive after the response is sent. waitUntil is only
// available inside the function runtime, so it is loaded lazily and the delivery
// is simply awaited when it is not.
async function background(promise) {
  try {
    const { waitUntil } = await import("base44:runtime");
    waitUntil(promise);
  } catch {
    await promise;
  }
}

// Every delivery attempt is journalled so the agency can audit what its own
// systems and marketplaces received. Logging never breaks a shipment flow.
async function logDelivery(log, result) {
  const ctx = log || {};
  if (!ctx.service || !ctx.tenant_id) return;
  try {
    await ctx.service.entities.WebhookDelivery.create({
      tenant_id: ctx.tenant_id,
      endpoint_id: ctx.endpoint_id || "",
      label: ctx.label || "Ad-hoc endpoint",
      url: ctx.url || "",
      event: result.event,
      status_code: result.status_code,
      success: result.success,
      duration_ms: result.duration_ms,
      response_snippet: result.response_snippet || "",
      error: result.error || "",
      payload_ref: ctx.payload_ref || "",
      delivered_at: new Date().toISOString(),
      member_emails: ctx.member_emails || [],
    });
    if (ctx.endpoint_id) {
      await ctx.service.entities.WebhookEndpoint.update(ctx.endpoint_id, {
        last_status: result.status_code,
        last_delivery_at: new Date().toISOString(),
        last_error: result.error || "",
      });
    }
  } catch {
    // Best effort: the delivery log must never fail the caller.
  }
}

// Outbound webhook delivery, shared by the merchant API and the marketplace
// bridge. Returns the fetch promise so the caller can hand it to waitUntil.
// The endpoint verifies the caller with an HMAC over the timestamp and the exact
// body it received: the shared secret never travels, and a captured request
// cannot be replayed later.
async function signatureHeaders(secret, body) {
  if (!secret) return {};
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
    const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return { "X-Express-Timestamp": String(timestamp), "X-Express-Signature": `sha256=${hex}` };
  } catch {
    return {};
  }
}

export async function deliverWebhook(url, event, payload, log) {
  if (!url || !/^https?:\/\//i.test(String(url))) return null;
  const started = Date.now();
  const context = { ...(log || {}), url };
  const body = JSON.stringify({ event, ...payload });
  const signature = await signatureHeaders(context.secret, body);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Express-Event": event,
      ...signature,
    },
    body,
    signal: AbortSignal.timeout(8000),
  })
    .then(async (response) => {
      const text = await response.text().catch(() => "");
      await logDelivery(context, {
        event,
        status_code: response.status,
        success: response.ok,
        duration_ms: Date.now() - started,
        response_snippet: String(text || "").slice(0, 300),
        error: response.ok ? "" : `HTTP ${response.status}`,
      });
      return response;
    })
    .catch(async (error) => {
      await logDelivery(context, {
        event,
        status_code: 0,
        success: false,
        duration_ms: Date.now() - started,
        error: String((error && error.message) || error || "Request failed").slice(0, 300),
      });
      return null;
    });
}

// Fans one event out to every endpoint the agency configured for it.
export async function dispatchWebhooks(service, options) {
  const opts = options || {};
  if (!opts.tenant_id) return 0;
  const endpoints = await service.entities.WebhookEndpoint.filter({
    tenant_id: opts.tenant_id,
    active: true,
  });
  let sent = 0;
  for (const endpoint of endpoints) {
    const subscribed = endpoint.events || [];
    if (subscribed.length && !subscribed.includes(opts.event)) continue;
    const job = deliverWebhook(endpoint.url, opts.event, opts.payload || {}, {
      service,
      tenant_id: opts.tenant_id,
      endpoint_id: endpoint.id,
      label: endpoint.label || endpoint.url,
      secret: endpoint.secret || "",
      member_emails: opts.member_emails || endpoint.member_emails || [],
      payload_ref: opts.payload_ref || "",
    });
    if (job) {
      sent += 1;
      background(job);
    }
  }
  return sent;
}