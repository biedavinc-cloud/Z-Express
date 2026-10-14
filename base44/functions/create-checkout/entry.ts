// Base44 Payments checkout starter — base44/functions/create-checkout/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (session construct + persisting the
// join key + return-URL resolution). Edit only the region marked `// ===== APP-SPECIFIC =====`
// to resolve — SERVER-SIDE — what the buyer is purchasing and its price.
//
// PUBLIC by default: a buyer does NOT need to be logged in to check out. Backend function routes
// are callable anonymously, and storefront buyers often have no account — requiring login here is
// what blocks real purchases. If a buyer IS signed in we record their app-user id as the
// fulfillment target; otherwise the webhook grants by the buyer's email. Never 401 here.
//
// CRITICAL: Wix's checkout has NO custom-metadata field, so the returned `checkoutSession.id` is
// the ONLY thing that ties this payment back to this purchase. We persist it on a pending
// Base44Purchase BEFORE redirecting; the webhook resolves the purchase by that same id
// (order.checkoutId === checkoutSession.id). Skipping this write makes fulfillment impossible.

import { createClientFromRequest } from "npm:@base44/sdk";
import { resolveTenantActor } from "../../shared/access.ts";
import { quote, TRIAL_DAYS } from "../../shared/pricing.ts";

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

// The app's public base URL for the buyer's return links. Use the platform-injected
// `X-Base44-App-Url` header (server-set from app state — correct behind custom domains), then the
// server-owned `WIX_CHECKOUT_APP_URL` secret. We do NOT fall back to the request `Origin`: it's
// caller-controlled, so a spoofed Origin would make Wix send the paid buyer to an attacker page
// (open redirect). Both sources above are always present for a connected payments app.
function resolveAppUrl(req: Request): string {
  return (
    req.headers.get("x-base44-app-url") ||
    Deno.env.get("WIX_CHECKOUT_APP_URL") ||
    ""
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    // Read per request, never at module scope: disconnecting payments blanks these, and a warm
    // isolate that captured them at startup would keep charging with the old credentials.
    const WIX_API_KEY = Deno.env.get("WIX_CHECKOUT_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_CHECKOUT_SITE_ID");
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("create-checkout: Wix payment config not set");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }

    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      // Fail closed: with no server-owned app URL (both the X-Base44-App-Url header AND the
      // WIX_CHECKOUT_APP_URL secret are absent — e.g. a slug-less or partially-wired app) we'd build
      // relative return links like `/ThankYou` and strand the paid buyer. Never fall back to the
      // caller-controlled Origin (open redirect). Reconnecting payments repopulates the secret.
      console.error("create-checkout: no app URL (X-Base44-App-Url header and WIX_CHECKOUT_APP_URL both empty)");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }
    const base44 = createClientFromRequest(req);

    // Capture the buyer's app-user id IF signed in — but never REQUIRE it. This is the
    // fulfillment target the webhook grants to; when absent (anonymous buyer) the webhook grants
    // by the email the buyer enters on Wix's checkout page.
    let appUser = null;
    try {
      appUser = await base44.auth.me();
    } catch (_) {
      appUser = null;
    }

    const body = await req.json().catch(() => ({}));

    // ===== APP-SPECIFIC =====
    // Z. Express sells recurring logistics subscriptions (starter / pro / enterprise, monthly or
    // yearly, optional 30-day trial). The client sends a plan id, a cycle, a start mode and the
    // agency's billing details — never a price. We resolve the authoritative price here from the
    // shared price table and build a Wix recurring subscription; the buyer's email/name/address are
    // collected on Wix's hosted checkout page.
    const productId = String(body.productId ?? body.plan ?? "");
    const cycle = body.billing_cycle === "yearly" ? "yearly" : "monthly";
    const startMode = body.start_mode === "now" ? "now" : "trial";
    const extraSeats = Math.max(0, Math.floor(Number(body.extra_seats) || 0));
    const tenantId = String(body.tenant_id ?? "");

    const priced = quote({ planId: productId, cycle, extraSeats });
    if (!priced) return new Response(JSON.stringify({ error: "Unknown plan" }), { status: 400 });

    // Resolve the agency the signed-in user may subscribe, and confirm they may (agency manager,
    // billing manager or platform admin). Checkout stays public — an anonymous buyer simply has no
    // agency to subscribe.
    let tenant = null;
    if (appUser && tenantId) {
      const actor = await resolveTenantActor(base44.asServiceRole, appUser, tenantId);
      if (!actor.error) tenant = actor.tenant;
    }
    if (!tenant && appUser) {
      const rows = await base44.asServiceRole.entities.Tenant.filter(
        { owner_email: appUser.email },
        { sort: "-created_date", limit: 1 }
      );
      tenant = (rows.items || rows)[0] || null;
    }
    if (!tenant) {
      return new Response(JSON.stringify({ error: "No agency found for this account" }), { status: 404 });
    }

    const productName = `Z. Express ${priced.plan.id} plan (${cycle})`;
    const price = priced.subtotal.toFixed(2);
    const currency = priced.currency;
    // A subscription is a single entitlement — quantity is fixed at 1.
    const quantity = 1;

    // Recurring subscription. autoRenewal true = an infinite plan the agency cancels from the
    // portal. A new agency may start with a free month: Wix collects the payment method now and
    // charges after the trial.
    const subscriptionInfo = {
      subscriptionSettings: {
        frequency: cycle === "yearly" ? "YEAR" : "MONTH",
        autoRenewal: true,
        ...(startMode === "trial" ? { freeTrialPeriod: { frequency: "DAY", interval: TRIAL_DAYS } } : {}),
      },
      title: `Z. Express ${priced.plan.id} (${cycle})`,
      description: `Logistics platform subscription — ${priced.seats} users`,
    };

    // Billing details the agency entered on the portal form; the webhook reuses them to issue the
    // invoice (Wix collects email/name/address but not company or tax id).
    const billing = body.billing || {};
    const billingDetails = {
      company: String(billing.company ?? tenant.legal_name ?? tenant.name ?? "").slice(0, 160),
      name: String(billing.contact_name ?? appUser?.full_name ?? "").slice(0, 120),
      email: String(billing.email ?? appUser?.email ?? "").slice(0, 160),
      phone: String(billing.phone ?? tenant.phone ?? "").slice(0, 40),
      country: String(billing.country ?? tenant.country ?? "").slice(0, 80),
      city: String(billing.city ?? tenant.city ?? "").slice(0, 80),
      address: String(billing.address ?? tenant.address ?? "").slice(0, 200),
      tax_id: String(billing.tax_id ?? "").slice(0, 60),
    };

    // Where Wix returns the buyer — the portal subscription page (the agency manager is signed in,
    // so the authed route is reachable on return).
    const thankYouPath = "/portal/subscription";
    const postFlowPath = "/portal/subscription";
    // ===== END APP-SPECIFIC =====

    const total = parseFloat(price) * quantity;
    if (!(total >= 0.5)) {
      // Wix rejects charges under 0.50 in the charged currency (major units, not cents).
      return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
    }

    const constructBody = {
      cart: {
        items: [{ name: productName, quantity, price, ...(subscriptionInfo ? { subscriptionInfo } : {}) }],
        // Prefill the signed-in buyer's email if we have one; anonymous buyers enter it on Wix.
        ...(appUser?.email ? { customerInfo: { email: appUser.email } } : {}),
      },
      callbackUrls: {
        thankYouPageUrl: `${appUrl}${thankYouPath}`,
        postFlowUrl: `${appUrl}${postFlowPath}`,
      },
    };

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: "POST",
      headers: {
        "Authorization": WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(constructBody),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error("create-checkout: Wix construct failed", { status: wixRes.status, errText });
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    // PERSIST THE JOIN KEY (the whole point). Pending until the webhook flips it to "paid".
    // asServiceRole so the row is trustworthy — Base44Purchase RLS blocks client writes, so a buyer
    // can't forge a paid purchase. appUserId is the fulfillment target when known; null for an
    // anonymous buyer (the webhook then grants by buyerEmail).
    await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      // The server-resolved product key — the webhook grant reads this to decide what to unlock.
      productId,
      productName,
      // Persist the validated quantity so the webhook's grant can award the RIGHT count
      // (seats/credits/items) for a multi-unit purchase — the grant runs later from this row and has
      // no other authoritative count. (Fixed-entitlement plans keep quantity 1.)
      quantity,
      // Charged total (unit price × quantity), so the record matches what Wix charged.
      amount: total.toFixed(2),
      currency,
      // Z. Express subscription context the webhook grant reads to activate the agency.
      tenantId: tenant.id,
      plan: productId,
      billingCycle: cycle,
      seats: priced.seats,
      trial: startMode === "trial",
      billing: billingDetails,
    });

    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout: unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});