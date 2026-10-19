// Starts a hosted checkout for an agency subscription.
//
// The browser only sends a plan id, a billing cycle and billing details, never a
// price: the amount is resolved here from the shared price table. A pending
// Purchase is written BEFORE the buyer is redirected, because its checkout id is
// the only key that ties the later payment webhook back to this subscription.
//
// The hosted payment page is created by the provider configured through:
//   PAYMENT_PROVIDER_URL   endpoint that creates a checkout session (POST JSON)
//   PAYMENT_PROVIDER_KEY   bearer key for that endpoint
//   APP_URL                public address of this web app (return links)
// The endpoint answers { "redirect_url": "https://..." }.

import { createClientFromRequest, serve, appUrl } from "../_shared/platform.ts";
import { resolveTenantActor } from "../_shared/access.ts";
import { quote, TRIAL_DAYS } from "../_shared/pricing.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function handler(req: Request) {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Read per request, never at module scope, so rotated credentials apply at once.
    const providerUrl = Deno.env.get("PAYMENT_PROVIDER_URL");
    const providerKey = Deno.env.get("PAYMENT_PROVIDER_KEY");
    if (!providerUrl || !providerKey) {
      console.error("create-checkout: payment provider is not configured");
      return json({ error: "Online payments are not set up yet.", code: "payments_not_configured" }, 503);
    }

    // Never fall back to the request Origin: it is caller-controlled, so a spoofed
    // Origin would send a paying buyer to an attacker's page (open redirect).
    const baseUrl = appUrl();
    if (!baseUrl) {
      console.error("create-checkout: APP_URL is not set");
      return json({ error: "Online payments are not set up yet.", code: "payments_not_configured" }, 503);
    }

    const client = createClientFromRequest(req);
    // Checkout is reachable without an account, but an agency subscription needs one.
    const appUser = await client.auth.me();
    const body = await req.json().catch(() => ({}));

    // Z. Express sells recurring logistics subscriptions (starter / pro / enterprise, monthly or
    // yearly, optional 30-day trial). The client sends a plan id, a cycle, a start mode and the
    // agency's billing details — never a price. We resolve the authoritative price here from the
    // shared price table and describe a recurring subscription to the payment provider.
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
      const actor = await resolveTenantActor(client.asServiceRole, appUser, tenantId);
      if (!actor.error) tenant = actor.tenant;
    }
    if (!tenant && appUser) {
      const rows = await client.asServiceRole.entities.Tenant.filter(
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
    // portal. A new agency may start with a free month: the provider collects the payment method now
    // and charges after the trial.
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
    // invoice (company and tax id are not collected by the provider).
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

    // Where the provider returns the buyer — the portal subscription page (the agency manager is signed in,
    // so the authed route is reachable on return).
    const thankYouPath = "/portal/subscription";
    const postFlowPath = "/portal/subscription";
    const total = parseFloat(price) * quantity;
    if (!(total >= 0.5)) {
      return json({ error: "Amount must be at least 0.50" }, 400);
    }

    // PERSIST THE JOIN KEY first. Pending until the webhook flips it to "paid".
    // Written with the service role so a buyer cannot forge a paid purchase.
    const checkoutSessionId = crypto.randomUUID();
    const purchase = await client.asServiceRole.entities.Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      productId,
      productName,
      quantity,
      amount: total.toFixed(2),
      currency,
      tenantId: tenant.id,
      plan: productId,
      billingCycle: cycle,
      seats: priced.seats,
      trial: startMode === "trial",
      billing: billingDetails,
    });

    const providerRes = await fetch(providerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${providerKey}` },
      body: JSON.stringify({
        checkout_id: checkoutSessionId,
        amount: price,
        currency,
        product_name: productName,
        description: subscriptionInfo.description,
        customer_email: appUser?.email ?? undefined,
        recurring: {
          interval: cycle === "yearly" ? "year" : "month",
          trial_days: startMode === "trial" ? TRIAL_DAYS : 0,
        },
        success_url: `${baseUrl}${thankYouPath}`,
        cancel_url: `${baseUrl}${postFlowPath}`,
      }),
    });

    const session = providerRes.ok ? await providerRes.json().catch(() => null) : null;
    const redirectUrl: string | undefined = session?.redirect_url ?? session?.redirectUrl;

    if (!redirectUrl) {
      console.error("create-checkout: provider did not return a checkout page", { status: providerRes.status });
      // Do not leave an orphan pending row behind.
      await client.asServiceRole.entities.Purchase.update(purchase.id, { status: "canceled" }).catch(() => null);
      return json({ error: "Could not start checkout" }, 502);
    }

    return json({ redirectUrl });
  } catch (err) {
    console.error("create-checkout: unhandled error", err);
    return json({ error: "Internal error" }, 500);
  }
}

serve(handler);
