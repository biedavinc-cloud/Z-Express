import { createClientFromRequest, serve } from '../_shared/platform.ts';
import { resolveTenantActor } from '../_shared/access.ts';
import { TRIAL_DAYS, providerForMethod, quote } from '../_shared/pricing.ts';

// Subscription checkout. The browser sends a plan, a billing cycle, how the agency
// wants to pay and its billing details — never a price, never a provider. Every
// amount is recomputed here from the server's own price table, and only the
// subscription is invoiced: the provider that collects the rail, and its fee, are
// ours and are recorded for our own accounting.

const BILLING_ROLES = ['tenant_admin', 'billing_manager'];
const METHODS = ['card', 'mobile_money', 'bank'];

const text = (value, max = 200) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);
const addDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const isEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`;
}

function paymentReference() {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `PAY-${random || Date.now().toString(36).toUpperCase()}`;
}

// Billing records are readable by the agency's finance roles only, exactly like
// the rest of the billing collections.
async function billingAudience(service, tenant, member) {
  const rows = await service.entities.TeamMember.filter({ tenant_id: tenant.id });
  const members = Array.isArray(rows) ? rows : rows.items || [];
  const emails = members
    .filter((row) => row.status !== 'suspended' && BILLING_ROLES.includes(row.role))
    .map((row) => row.email);
  return Array.from(
    new Set([tenant.owner_email, ...(tenant.member_emails || []), ...emails, member?.email].filter(Boolean))
  );
}

async function handler(req: Request) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 });

    const service = client.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const tenantId = text(body.tenant_id, 40);
    if (!tenantId) return Response.json({ error: 'tenant_id is required', code: 'missing_tenant' });

    const actor = await resolveTenantActor(service, user, tenantId);
    if (actor.error) return Response.json({ error: actor.error, code: actor.code }, { status: actor.status });
    if (actor.role !== 'platform_admin' && !BILLING_ROLES.includes(actor.role)) {
      return Response.json(
        { error: 'Only an agency manager or the billing manager can subscribe', code: 'forbidden' },
        { status: 403 }
      );
    }
    const tenant = actor.tenant;

    // Cancelling closes the subscription at the end of the period the agency has
    // already paid for: the plan runs to that date and nothing further is billed.
    if (body.action === 'cancel') {
      const rows = await service.entities.Subscription.filter(
        { tenant_id: tenant.id },
        { sort: '-created_date', limit: 1 }
      );
      const current = (rows.items || rows)[0];
      if (!current) return Response.json({ error: 'No subscription to cancel', code: 'no_subscription' });
      if (current.status === 'cancelled') {
        return Response.json({ ok: true, status: 'cancelled', current_period_end: current.current_period_end });
      }
      const closedAt = new Date().toISOString().slice(0, 10);
      await service.entities.Subscription.update(current.id, {
        status: 'cancelled',
        notes: [current.notes, `Cancelled ${closedAt}`].filter(Boolean).join(' | ').slice(0, 400),
      });

      // Stop the real recurring charge at the provider: soft-cancel so the agency keeps the
      // period it already paid for, then ends naturally.
      try {
        const purchaseRows = await service.entities.Purchase.filter(
          { tenantId: tenant.id, status: 'paid' },
          { sort: '-created_date', limit: 10 }
        );
        const purchases = purchaseRows.items || purchaseRows;
        const withSub = purchases.find((p) => p.subscriptionId);
        if (withSub?.subscriptionId) {
          // Provider-side cancellation is optional: when PAYMENT_CANCEL_URL is set the
          // provider is told to stop renewing after the current paid period.
          const cancelUrl = Deno.env.get('PAYMENT_CANCEL_URL');
          const providerKey = Deno.env.get('PAYMENT_PROVIDER_KEY');
          if (cancelUrl && providerKey) {
            await fetch(cancelUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerKey}` },
              body: JSON.stringify({ subscription_id: withSub.subscriptionId, immediate: false }),
            });
          }
        }
      } catch (cancelErr) {
        console.error('billingCheckout: provider cancel failed', cancelErr);
      }

      return Response.json({
        ok: true,
        status: 'cancelled',
        current_period_end: current.current_period_end,
        cancelled_at: closedAt,
      });
    }

    const cycle = body.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    const method = METHODS.includes(body.method) ? body.method : 'card';
    // The agency only chooses how it pays. Which provider collects that rail is ours
    // to decide, and its fee is our own cost: it is recorded on the invoice for our
    // accounting, never added to what the agency is billed.
    const provider = providerForMethod(method);
    const priced = quote({
      planId: text(body.plan, 20),
      cycle,
      extraSeats: Number(body.extra_seats) || 0,
      providerId: provider?.id,
    });
    if (!priced) return Response.json({ error: 'Unknown plan', code: 'unknown_plan' });

    const billing = body.billing || {};
    const contact = {
      company: text(billing.company, 160),
      name: text(billing.contact_name, 120),
      email: text(billing.email, 160).toLowerCase(),
      phone: text(billing.phone, 40),
      country: text(billing.country, 80),
      city: text(billing.city, 80),
      address: text(billing.address, 200),
      tax_id: text(billing.tax_id, 60),
    };
    if (!contact.company || !contact.name || !contact.email) {
      return Response.json({ error: 'Company, contact name and email are required', code: 'missing_billing_details' });
    }
    if (!isEmail(contact.email)) return Response.json({ error: 'That email address is invalid', code: 'invalid_email' });
    if (method === 'mobile_money' && !text(body.momo_number, 40)) {
      return Response.json({ error: 'A mobile money number is required', code: 'missing_momo_number' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const trialEnd = addDays(TRIAL_DAYS);
    const existingRows = await service.entities.Subscription.filter(
      { tenant_id: tenant.id },
      { sort: '-created_date', limit: 1 }
    );
    const existing = (existingRows.items || existingRows)[0] || null;

    // The free month belongs to a new subscription: an agency that already pays is
    // charged for the period it is moving to.
    const alreadyPaying = Boolean(existing && existing.status === 'active');
    const trial = body.start_mode !== 'pay_now' && !alreadyPaying;
    const status = trial ? 'trialing' : 'active';
    const periodEnd = trial ? trialEnd : addDays(cycle === 'yearly' ? 365 : 30);
    const dueAt = trial ? trialEnd : today;
    const audience = await billingAudience(service, tenant, actor.member);
    const reference = paymentReference();

    const payload = {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      plan: priced.plan.id,
      amount: priced.monthlyEquivalent,
      currency: priced.currency,
      billing_cycle: cycle,
      status,
      seats: priced.seats,
      current_period_end: periodEnd,
      notes: `${provider?.label || 'provider'} · ${method} · ${contact.company} · ${reference}`,
    };

    const subscription = existing
      ? await service.entities.Subscription.update(existing.id, {
          ...payload,
          started_at: existing.started_at || today,
        })
      : await service.entities.Subscription.create({
          ...payload,
          started_at: today,
          member_emails: audience,
        });

    const invoice = await service.entities.Invoice.create({
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      number: invoiceNumber(),
      plan: priced.plan.id,
      // The agency pays its subscription. The provider's fee is kept in the notes
      // below for our own accounting; it is never added to this amount.
      amount: priced.subtotal,
      currency: priced.currency,
      billing_cycle: cycle,
      seats: priced.seats,
      period_start: today,
      period_end: periodEnd,
      issued_at: today,
      due_at: dueAt,
      status: 'pending',
      method: `${provider?.label || 'provider'} · ${method}`,
      notes: [
        `Reference ${reference}`,
        `Subtotal ${priced.subtotal} ${priced.currency}`,
        priced.discount ? `Annual discount ${priced.discount}` : '',
        `Transaction fee ${priced.fee}`,
        `Billed to ${contact.company} · ${contact.name} · ${contact.email}${contact.phone ? ` · ${contact.phone}` : ''}`,
        contact.tax_id ? `Tax ID ${contact.tax_id}` : '',
        trial ? `First month free, first payment due ${dueAt}` : 'Payable now',
      ]
        .filter(Boolean)
        .join(' | '),
      member_emails: audience,
    });

    await service.entities.Tenant.update(tenant.id, {
      plan: priced.plan.id,
      monthly_fee: priced.monthlyEquivalent,
    });

    return Response.json({
      ok: true,
      subscription_id: subscription.id,
      plan: priced.plan.id,
      cycle,
      seats: priced.seats,
      trial_ends_at: trial ? trialEnd : '',
      reference,
      provider: provider?.label || '',
      method,
      invoice: {
        number: invoice.number,
        amount: priced.subtotal,
        subtotal: priced.subtotal,
        discount: priced.discount,
        currency: priced.currency,
        status: invoice.status,
        due_at: dueAt,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
