// Payment fulfillment webhook.
//
// The payment provider (any PSP able to call a webhook) posts a small JSON event
// signed with HMAC-SHA256. The handler verifies the signature, resolves the
// pending Purchase written by `create-checkout`, and activates the agency's
// subscription exactly once.
//
// Request
//   POST /functions/v1/payments-webhook
//   x-signature: <hex HMAC-SHA256 of the raw body, keyed with PAYMENTS_WEBHOOK_SECRET>
//   { "type": "payment.approved" | "subscription.ended",
//     "checkout_id": "...",      // the id create-checkout handed to the provider
//     "order_id": "...",         // provider reference (optional)
//     "subscription_id": "...",  // provider recurring-subscription id (optional)
//     "buyer_email": "..." }     // used when the buyer was not signed in (optional)

import { createClientFromRequest, serve } from '../_shared/platform.ts';

const PAYMENT_APPROVED = "payment.approved";
const SUBSCRIPTION_ENDED = "subscription.ended";

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Constant-time comparison so the signature cannot be guessed byte by byte.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read per request, never at module scope, so a rotated secret takes effect at once.
    const secret = Deno.env.get("PAYMENTS_WEBHOOK_SECRET");
    if (!secret) {
      // Never process an unverifiable event. A missing secret is a misconfiguration, not a retry case.
      console.error("payments-webhook: PAYMENTS_WEBHOOK_SECRET is not set");
      return new Response("Webhook not configured", { status: 500 });
    }

    const raw = await req.text();
    const given = (req.headers.get("x-signature") || "").replace(/^sha256=/i, "").trim().toLowerCase();
    const expected = await hmacHex(secret, raw);
    if (!given || !safeEqual(given, expected)) {
      console.error("payments-webhook: signature check failed");
      return new Response("Invalid signature", { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const client = createClientFromRequest(req);
    const db = client.asServiceRole; // No end user is authenticated on a webhook call.

    if (event?.type === PAYMENT_APPROVED) return await handleOrderApproved(db, event);
    if (event?.type === SUBSCRIPTION_ENDED) return await handleSubscriptionEnded(db, event);

    // Unknown/irrelevant event: acknowledge so the provider stops retrying.
    console.log(`payments-webhook: ignoring event ${event?.type}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    // 500 tells the provider to retry later (the handlers are idempotent).
    console.error("payments-webhook: unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
}

serve(handler);

async function handleOrderApproved(db: any, event: any): Promise<Response> {
  const checkoutId: string | undefined = event?.checkout_id || undefined;
  const orderId: string | undefined = event?.order_id || undefined;
  // Subscription id (if any) is persisted below so a later "subscription.ended"
  // event can resolve this purchase and revoke access.
  const subscriptionId: string | undefined = event?.subscription_id || undefined;

  if (!checkoutId) {
    // Nothing to correlate on. Acknowledge to stop retries; log for investigation.
    console.error("payments-webhook: payment.approved is missing checkout_id", { orderId });
    return new Response("OK", { status: 200 });
  }

  // Resolve the pending purchase created by `create-checkout` (join key: checkoutSessionId).
  const matches = await db.entities.Purchase.filter({ checkoutSessionId: checkoutId });
  const purchase = matches?.[0];

  if (!purchase) {
    // The pending Purchase is written by create-checkout before the buyer pays, so a miss
    // here is a transient race: return 500 so the provider retries, rather than
    // acknowledging a paid order we cannot fulfil.
    console.warn("payments-webhook: no Purchase for checkout_id yet, asking the provider to retry", { checkoutId, orderId });
    return new Response("Purchase not found yet", { status: 500 });
  }

  // IDEMPOTENCY + terminal states: providers deliver events more than once, and may deliver
  // a stale approval after a cancellation. Skip if already "paid" (prevents double-grant) or
  // "canceled" (a late approval must not resurrect a revoked subscription).
  if (purchase.status === "paid" || purchase.status === "canceled") {
    console.log("payments-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
    return new Response("OK", { status: 200 });
  }

  // The buyer's email: from create-checkout if they were signed in, otherwise from the
  // provider event (the only identity an anonymous buyer has). Persisted below and used by the grant block.
  const buyerEmail: string | null = purchase.buyerEmail ?? (event?.buyer_email ? String(event.buyer_email) : null);

  // ===== APP-SPECIFIC =====
  // Activate the agency's subscription. The purchase carries the plan, cycle, seats and trial
  // flag resolved at checkout; we mirror them onto the tenant's Subscription record, issue an
  // invoice (paid for a pay-now checkout, pending for a trial whose first charge is due at the
  // trial end) and lift the tenant's plan. Every effect keys on the tenant id, so a duplicate
  // payment.approved delivery is safe to run twice.
  const plan = purchase.plan || purchase.productId;
  const cycle = purchase.billingCycle || "monthly";
  const seats = purchase.seats || 1;
  const trial = Boolean(purchase.trial);
  const tenantId = purchase.tenantId;

  if (tenantId) {
    const tenant = await db.entities.Tenant.get(tenantId).catch(() => null);
    if (tenant) {
      const today = new Date().toISOString().slice(0, 10);
      const periodEnd = trial
        ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
        : new Date(Date.now() + (cycle === "yearly" ? 365 : 30) * 86400000).toISOString().slice(0, 10);

      const memberRows = await db.entities.TeamMember.filter({ tenant_id: tenantId });
      const memberList = Array.isArray(memberRows) ? memberRows : memberRows.items || [];
      const audience = Array.from(
        new Set(
          [
            tenant.owner_email,
            ...(tenant.member_emails || []),
            ...memberList
              .filter((m) => m.status !== "suspended" && ["tenant_admin", "billing_manager"].includes(m.role))
              .map((m) => m.email),
            buyerEmail,
          ].filter(Boolean)
        )
      );

      const subRows = await db.entities.Subscription.filter(
        { tenant_id: tenantId },
        { sort: "-created_date", limit: 1 }
      );
      const existingSub = (subRows.items || subRows)[0] || null;
      const subPayload = {
        tenant_id: tenantId,
        tenant_name: tenant.name,
        plan,
        amount: trial ? 0 : Number(purchase.amount || 0),
        currency: purchase.currency || "USD",
        billing_cycle: cycle,
        status: trial ? "trialing" : "active",
        seats,
        current_period_end: periodEnd,
        notes: "Online payment subscription",
      };
      if (existingSub) {
        await db.entities.Subscription.update(existingSub.id, {
          ...subPayload,
          started_at: existingSub.started_at || today,
        });
      } else {
        await db.entities.Subscription.create({ ...subPayload, started_at: today, member_emails: audience });
      }

      const billing = purchase.billing || {};
      await db.entities.Invoice.create({
        tenant_id: tenantId,
        tenant_name: tenant.name,
        number: `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`,
        plan,
        amount: Number(purchase.amount || 0),
        currency: purchase.currency || "USD",
        billing_cycle: cycle,
        seats,
        period_start: today,
        period_end: periodEnd,
        issued_at: today,
        due_at: trial ? periodEnd : today,
        status: trial ? "pending" : "paid",
        paid_at: trial ? null : new Date().toISOString(),
        method: "Online payment",
        notes: [
          `Order ${orderId || ""}`,
          `Billed to ${billing.company || tenant.name} · ${billing.name || ""} · ${billing.email || buyerEmail || ""}`,
          billing.tax_id ? `Tax ID ${billing.tax_id}` : "",
          trial ? "First month free — first charge at trial end" : "Paid online",
        ]
          .filter(Boolean)
          .join(" | "),
        member_emails: audience,
      });

      await db.entities.Tenant.update(tenantId, { plan, monthly_fee: Number(purchase.amount || 0) });
    }
  }
  // ===== END APP-SPECIFIC =====

  // Mark paid LAST, so "paid" always implies the grant above completed. The idempotency
  // check at the top short-circuits on this status, so it must only be set after fulfillment.
  // subscriptionId is stored here so SUBSCRIPTION_CANCELED/EXPIRED can resolve this purchase.
  await db.entities.Purchase.update(purchase.id, {
    status: "paid",
    orderId: orderId ?? purchase.orderId ?? null,
    subscriptionId: subscriptionId ?? purchase.subscriptionId ?? null,
    // Persist the buyer email (backfilled from the provider event for anonymous buyers) so the record
    // always shows who paid, even when create-checkout had no signed-in user.
    buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
    paidAt: new Date().toISOString(),
  });

  console.log("payments-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId, orderId });
  return new Response("OK", { status: 200 });
}

async function handleSubscriptionEnded(db: any, event: any): Promise<Response> {
  // Cancelled early or expired after its last cycle: both revoke access.
  const subscriptionId: string | undefined = event?.subscription_id || undefined;

  if (!subscriptionId) {
    console.error("payments-webhook: subscription event is missing subscription_id");
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Purchase.filter({ subscriptionId });
  const purchase = matches?.[0];
  if (!purchase) {
    // The subscription id is written on the Purchase by the payment.approved handler. If an
    // end event arrives before (or racing) that approval, no Purchase matches yet: return
    // 500 so the provider retries until the approval has linked it.
    console.warn("payments-webhook: no Purchase for subscription yet, asking the provider to retry", { subscriptionId });
    return new Response("Purchase not linkable yet", { status: 500 });
  }

  if (purchase.status === "canceled") {
    return new Response("OK", { status: 200 }); // Idempotent.
  }

  // ===== APP-SPECIFIC =====
  // Revoke the agency's subscription: cancel the local subscription record and drop the tenant
  // back to the starter plan. Idempotent — the "already canceled" check above guards the update.
  const tenantId = purchase.tenantId;
  if (tenantId) {
    const subRows = await db.entities.Subscription.filter(
      { tenant_id: tenantId },
      { sort: "-created_date", limit: 1 }
    );
    const sub = (subRows.items || subRows)[0];
    if (sub && sub.status !== "cancelled") {
      await db.entities.Subscription.update(sub.id, {
        status: "cancelled",
        notes: `${sub.notes || ""} · Cancelled by payment webhook`.slice(0, 400),
      });
    }
    await db.entities.Tenant.update(tenantId, { plan: "starter", monthly_fee: 49 });
  }
  // ===== END APP-SPECIFIC =====

  // Mark canceled LAST, so "canceled" always implies access was actually revoked.
  await db.entities.Purchase.update(purchase.id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
  });

  console.log("payments-webhook: revoked subscription", { purchaseId: purchase.id, subscriptionId });
  return new Response("OK", { status: 200 });
}