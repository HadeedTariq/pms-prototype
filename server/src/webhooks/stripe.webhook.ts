// src/routes/webhooks/stripe.webhook.ts
import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { stripe } from "@/utils/stripe";
import { env } from "@/common/utils/envConfig";
import { logger } from "@/common/middleware/requestLogger";
import { db } from "@/db/client";
import { organizations, plans, subscriptions, subscriptionEvents } from "@/db";

// -----------------------------------------------------------------
// Main handler — mounted on POST /webhooks/stripe with express.raw
// -----------------------------------------------------------------
export async function stripeWebhookHandler(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    logger.warn({
      event: "stripe_webhook_missing_signature",
      controller: "stripeWebhookHandler",
    });
    return res.status(400).send("Missing stripe-signature header");
  }

  // 1. Verify the event came from Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer thanks to express.raw()
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.error({
      event: "stripe_webhook_signature_verification_failed",
      controller: "stripeWebhookHandler",
      error: err.message,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info({
    event: "stripe_webhook_received",
    controller: "stripeWebhookHandler",
    metadata: { stripeEventId: event.id, type: event.type },
  });

  // 2. Idempotency check
  const existing = await db
    .select({
      id: subscriptionEvents.id,
      processedAt: subscriptionEvents.processedAt,
    })
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.stripeEventId, event.id))
    .limit(1);

  if (existing.length > 0 && existing[0].processedAt) {
    logger.info({
      event: "stripe_webhook_already_processed",
      controller: "stripeWebhookHandler",
      metadata: { stripeEventId: event.id, type: event.type },
    });
    return res.json({ received: true, duplicate: true });
  }

  // 3. Insert event log row first (audit trail + replay support)
  if (existing.length === 0) {
    try {
      await db.insert(subscriptionEvents).values({
        stripeEventId: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
      });
    } catch (err: any) {
      // 23505 = another worker already inserted it (Stripe sent twice in parallel)
      if (err.code === "23505") {
        return res.json({ received: true, duplicate: true });
      }
      throw err;
    }
  }

  // 4. Dispatch
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, event.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub, event.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub, event.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, event.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, event.id);
        break;
      }

      default:
        logger.info({
          event: "stripe_webhook_unhandled_type",
          controller: "stripeWebhookHandler",
          metadata: { type: event.type, stripeEventId: event.id },
        });
    }

    // 5. Mark processed
    await db
      .update(subscriptionEvents)
      .set({ processedAt: new Date() })
      .where(eq(subscriptionEvents.stripeEventId, event.id));

    return res.json({ received: true });
  } catch (err: any) {
    logger.error({
      event: "stripe_webhook_processing_failed",
      controller: "stripeWebhookHandler",
      metadata: { stripeEventId: event.id, type: event.type },
      error: err.message,
      stack: err.stack,
    });

    // Record error on the event row
    await db
      .update(subscriptionEvents)
      .set({ error: String(err.message).slice(0, 500) })
      .where(eq(subscriptionEvents.stripeEventId, event.id));

    // Return 500 so Stripe retries with backoff
    return res.status(500).json({ error: "Processing failed" });
  }
}

// =================================================================
// Event handlers
// =================================================================

// -----------------------------------------------------------------
// checkout.session.completed
// The user paid. Fetch the subscription Stripe created and sync it.
// -----------------------------------------------------------------
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const orgId = session.client_reference_id;

  if (!orgId) {
    logger.warn({
      event: "stripe_checkout_missing_client_reference",
      controller: "stripeWebhookHandler",
      metadata: { sessionId: session.id, stripeEventId: eventId },
    });
    return;
  }

  // Persist the Stripe customer id to the org (idempotent)
  if (typeof session.customer === "string") {
    await db
      .update(organizations)
      .set({ stripeCustomerId: session.customer })
      .where(eq(organizations.id, orgId));

    await db
      .update(subscriptionEvents)
      .set({
        organizationId: orgId,
        stripeCustomerId: session.customer,
      })
      .where(eq(subscriptionEvents.stripeEventId, eventId));
  }

  // Fetch the full subscription so we have status + periods in one shot
  if (typeof session.subscription === "string") {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    await handleSubscriptionUpsert(sub, eventId);
  }
}

// -----------------------------------------------------------------
// customer.subscription.created / updated
// Upsert subscriptions + refresh the org cache in one transaction.
// -----------------------------------------------------------------
async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  eventId: string
) {
  // 1. Resolve the org
  let orgId = sub.metadata?.organizationId;

  if (!orgId && typeof sub.customer === "string") {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.stripeCustomerId, sub.customer))
      .limit(1);
    orgId = org?.id;
  }

  if (!orgId) {
    logger.warn({
      event: "stripe_subscription_missing_org",
      controller: "stripeWebhookHandler",
      metadata: { subscriptionId: sub.id, customer: sub.customer },
    });
    return;
  }

  // 2. Resolve the plan from the Stripe price id
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) {
    logger.warn({
      event: "stripe_subscription_missing_price",
      controller: "stripeWebhookHandler",
      metadata: { subscriptionId: sub.id },
    });
    return;
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, priceId))
    .limit(1);

  if (!plan) {
    logger.warn({
      event: "stripe_subscription_unknown_price",
      controller: "stripeWebhookHandler",
      metadata: { subscriptionId: sub.id, priceId },
    });
    return;
  }

  const subscriptionItem = sub.items.data[0];
  const periodStart = new Date(subscriptionItem.current_period_start * 1000);
  const periodEnd = new Date(subscriptionItem.current_period_end * 1000);
  const trialStart = sub.trial_start ? new Date(sub.trial_start * 1000) : null;
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
  const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;

  // 4. Transaction: upsert subscriptions + update org cache
  await db.transaction(async (tx) => {
    // 4a. Upsert subscription row
    await tx
      .insert(subscriptions)
      .values({
        organizationId: orgId,
        planId: plan.id,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : "",
        stripePriceId: priceId,
        status: sub.status as any,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart,
        trialEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt,
        metadata: (sub.metadata ?? {}) as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          planId: plan.id,
          stripePriceId: priceId,
          status: sub.status as any,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialStart,
          trialEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          canceledAt,
          metadata: (sub.metadata ?? {}) as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });

    // 4b. Refresh the org cache — middleware reads this on next request
    await tx
      .update(organizations)
      .set({
        planKey: plan.key,
        subscriptionStatus: sub.status as any,
        currentPeriodEnd: periodEnd,
        entitlements: plan.features,
      })
      .where(eq(organizations.id, orgId));

    // 4c. Annotate the event log with org + customer
    await tx
      .update(subscriptionEvents)
      .set({
        organizationId: orgId,
        stripeCustomerId:
          typeof sub.customer === "string" ? sub.customer : null,
      })
      .where(eq(subscriptionEvents.stripeEventId, eventId));
  });

  logger.info({
    event: "stripe_subscription_synced",
    controller: "stripeWebhookHandler",
    metadata: {
      subscriptionId: sub.id,
      orgId,
      planKey: plan.key,
      status: sub.status,
    },
  });
}

// -----------------------------------------------------------------
// customer.subscription.deleted
// Revoke entitlements. Keep the subscriptions row for audit.
// -----------------------------------------------------------------
async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  eventId: string
) {
  let orgId = sub.metadata?.organizationId;

  if (!orgId && typeof sub.customer === "string") {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.stripeCustomerId, sub.customer))
      .limit(1);
    orgId = org?.id;
  }

  if (!orgId) {
    logger.warn({
      event: "stripe_subscription_deleted_missing_org",
      controller: "stripeWebhookHandler",
      metadata: { subscriptionId: sub.id },
    });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));

    await tx
      .update(organizations)
      .set({
        subscriptionStatus: "canceled",
        entitlements: [],
      })
      .where(eq(organizations.id, orgId));

    await tx
      .update(subscriptionEvents)
      .set({ organizationId: orgId })
      .where(eq(subscriptionEvents.stripeEventId, eventId));
  });

  logger.info({
    event: "stripe_subscription_canceled",
    controller: "stripeWebhookHandler",
    metadata: { subscriptionId: sub.id, orgId },
  });
}

// -----------------------------------------------------------------
// invoice.paid
// Extends the period end. Useful for annual subscriptions where
// customer.subscription.updated may not fire on every renewal.
// -----------------------------------------------------------------
async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;

  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  // The subscription line item carries the new period
  const line = invoice.lines?.data?.[0];
  const periodEnd = line?.period?.end ? new Date(line.period.end * 1000) : null;

  if (periodEnd) {
    await db
      .update(organizations)
      .set({ currentPeriodEnd: periodEnd })
      .where(eq(organizations.id, org.id));
  }

  await db
    .update(subscriptionEvents)
    .set({ organizationId: org.id, stripeCustomerId: customerId })
    .where(eq(subscriptionEvents.stripeEventId, eventId));

  logger.info({
    event: "stripe_invoice_paid",
    controller: "stripeWebhookHandler",
    metadata: { orgId: org.id, invoiceId: invoice.id },
  });
}

// -----------------------------------------------------------------
// invoice.payment_failed
// Mark past_due. Don't revoke — Stripe's dunning retries automatically.
// If all retries fail, Stripe eventually sends customer.subscription.deleted.
// -----------------------------------------------------------------
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventId: string
) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;

  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  await db
    .update(organizations)
    .set({ subscriptionStatus: "past_due" })
    .where(eq(organizations.id, org.id));

  await db
    .update(subscriptionEvents)
    .set({ organizationId: org.id, stripeCustomerId: customerId })
    .where(eq(subscriptionEvents.stripeEventId, eventId));

  logger.warn({
    event: "stripe_invoice_payment_failed",
    controller: "stripeWebhookHandler",
    metadata: {
      orgId: org.id,
      invoiceId: invoice.id,
      attempt: invoice.attempt_count,
    },
  });
}
