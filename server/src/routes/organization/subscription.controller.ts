import { NextFunction, Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";

import { env } from "@/common/utils/envConfig";
import { stripe } from "@/utils/stripe";
import { errorParser } from "@/utils/errorParser.util";
import { logger } from "@/common/middleware/requestLogger";
import { db } from "@/db/client";
import { organizations, plans, subscriptions } from "@/db";
import { User } from "@/types/general";
import { createCheckoutSessionSchema } from "./onboarding.validator";

class SubscriptionController {
  constructor() {
    this.createCheckoutSession = this.createCheckoutSession.bind(this);
    this.createPortalSession = this.createPortalSession.bind(this);
    this.getSubscriptionStatus = this.getSubscriptionStatus.bind(this);
  }

  // -----------------------------------------------------------------
  // Helper — resolve the caller's organization
  // Mirrors getMyOrganization but throws instead of returning a response
  // so we can reuse it across handlers.
  // -----------------------------------------------------------------
  private async getOrganizationForUser(userId: string) {
    const rows = await db
      .select({
        id: organizations.id,
        title: organizations.title,
        email: organizations.email,
        stripeCustomerId: organizations.stripeCustomerId,
        planKey: organizations.planKey,
        subscriptionStatus: organizations.subscriptionStatus,
        currentPeriodEnd: organizations.currentPeriodEnd,
      })
      .from(organizations)
      .where(eq(organizations.ownerId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  // -----------------------------------------------------------------
  // POST /subscription/checkout
  // Body: { planKey: "starter" | "pro" }
  // -----------------------------------------------------------------
  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    logger.info({
      event: "create_checkout_session_initiated",
      controller: "subscriptionController",
      requestId: req.id,
      metadata: { userId: (req.body?.user as User)?.id },
    });

    // 1. Validate body
    const parsed = createCheckoutSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({
        event: "create_checkout_session_validation_failed",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: { errors: parsed.error },
      });
      return errorParser(parsed, res);
    }

    const { planKey } = parsed.data;
    const { user } = req.body as { user: User };

    if (!user?.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    try {
      // 2. User must have an organization to subscribe
      const org = await this.getOrganizationForUser(user.id);
      if (!org) {
        logger.warn({
          event: "create_checkout_session_no_organization",
          controller: "subscriptionController",
          requestId: req.id,
          metadata: { userId: user.id },
        });
        return res.status(404).json({
          message:
            "You need to create an organization before subscribing to a plan.",
        });
      }

      // 3. Resolve the plan from the DB
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.key, planKey))
        .limit(1);

      if (!plan || !plan.isActive) {
        logger.warn({
          event: "create_checkout_session_plan_not_found",
          controller: "subscriptionController",
          requestId: req.id,
          metadata: { userId: user.id, planKey },
        });
        return res.status(404).json({
          message: "Selected plan is not available.",
        });
      }

      // 4. Check for existing active subscriptions to prevent duplicate charges or handle upgrades
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.organizationId, org.id),
            inArray(subscriptions.status, ["active", "trialing", "past_due"])
          )
        )
        .limit(1);

      if (existingSubscription) {
        // Scenario A: They are already on this exact plan
        if (existingSubscription.planId === plan.id) {
          logger.warn({
            event: "create_checkout_session_already_subscribed",
            controller: "subscriptionController",
            requestId: req.id,
            metadata: { orgId: org.id, planKey },
          });
          return res.status(400).json({
            message: "Your organization is already subscribed to this plan.",
          });
        }

        // Scenario B: They are on a different plan and trying to upgrade/downgrade.
        // Redirect to the Stripe Billing Portal instead of creating a new checkout session.
        if (org.stripeCustomerId) {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: `${env.CORS_ORIGIN}/dashboard/billing`,
          });

          logger.info({
            event: "create_billing_portal_session_success",
            controller: "subscriptionController",
            requestId: req.id,
            metadata: { userId: user.id, orgId: org.id },
          });

          return res.status(200).json({
            message:
              "Redirecting to billing portal to modify your subscription.",
            url: portalSession.url,
          });
        }
      }

      // 5. Reuse or create the Stripe customer
      let stripeCustomerId = org.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: org.email ?? user.email ?? undefined,
          name: org.title,
          metadata: {
            organizationId: org.id,
            ownerUserId: user.id,
          },
        });

        stripeCustomerId = customer.id;

        // Persist immediately so webhooks + future sessions can find it
        await db
          .update(organizations)
          .set({ stripeCustomerId })
          .where(eq(organizations.id, org.id));

        logger.info({
          event: "create_checkout_session_customer_created",
          controller: "subscriptionController",
          requestId: req.id,
          metadata: { userId: user.id, orgId: org.id },
        });
      }

      // 6. Create the Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        allowed_payment_method_types: ["card"],
        customer: stripeCustomerId,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        client_reference_id: org.id,
        subscription_data: {
          metadata: {
            organizationId: org.id,
            planKey: plan.key,
          },
        },
        metadata: {
          organizationId: org.id,
          planKey: plan.key,
        },
        success_url: `${env.CORS_ORIGIN}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.CORS_ORIGIN}/dashboard/billing/cancel`,
        allow_promotion_codes: true,
      });

      logger.info({
        event: "create_checkout_session_success",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: {
          userId: user.id,
          orgId: org.id,
          planKey: plan.key,
          sessionId: session.id,
        },
      });

      return res.status(200).json({
        message: "Checkout session created.",
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      logger.error({
        event: "create_checkout_session_unexpected_error",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: { userId: user.id, planKey },
        error: error.message,
        stack: error.stack,
        code: error.code,
      });
      return next({
        message: "Failed to start the checkout process. Please try again.",
        status: 500,
      });
    }
  }

  // -----------------------------------------------------------------
  // POST /subscription/portal
  // Opens the Stripe-hosted billing portal for the current org.
  // -----------------------------------------------------------------
  async createPortalSession(req: Request, res: Response, next: NextFunction) {
    const { user } = req.body as { user: User };

    if (!user?.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    try {
      const org = await this.getOrganizationForUser(user.id);
      if (!org) {
        return res.status(404).json({ message: "Organization not found." });
      }

      if (!org.stripeCustomerId) {
        return res.status(400).json({
          message: "No billing account found. Please subscribe first.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${env.CORS_ORIGIN}/dashboard/billing`,
      });

      return res.status(200).json({
        message: "Portal session created.",
        url: session.url,
      });
    } catch (error: any) {
      logger.error({
        event: "create_portal_session_error",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: { userId: user.id },
        error: error.message,
      });
      return next({
        message: "Failed to open the billing portal.",
        status: 500,
      });
    }
  }

  // -----------------------------------------------------------------
  // GET /subscription/me
  // Returns the current billing/plan state for the caller's org.
  // Used by the dashboard to render "upgrade" UI, renewal date, etc.
  // -----------------------------------------------------------------
  async getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
    logger.info({
      event: "get_subscription_status_initiated",
      controller: "subscriptionController",
      requestId: req.id,
      metadata: { userId: (req.body?.user as User)?.id },
    });

    const { user } = req.body as { user: User };

    if (!user?.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    try {
      const [org] = await db
        .select({
          id: organizations.id,
          planKey: organizations.planKey,
          subscriptionStatus: organizations.subscriptionStatus,
          currentPeriodEnd: organizations.currentPeriodEnd,
          entitlements: organizations.entitlements,
          stripeCustomerId: organizations.stripeCustomerId,
        })
        .from(organizations)
        .where(eq(organizations.ownerId, user.id))
        .limit(1);

      if (!org) {
        logger.warn({
          event: "get_subscription_status_no_organization",
          controller: "subscriptionController",
          requestId: req.id,
          metadata: { userId: user.id },
        });
        return res.status(404).json({
          message: "Organization not found.",
        });
      }

      // If org has never subscribed, planKey and status are null.
      // Frontend should treat this as "no active plan → show plans page".
      if (!org.planKey) {
        return res.status(200).json({
          hasSubscription: false,
          planKey: null,
          subscriptionStatus: null,
          currentPeriodEnd: null,
          entitlements: [],
          hasBillingAccount: Boolean(org.stripeCustomerId),
        });
      }

      // For an active plan, also fetch the plan row for display details
      // (name, price) — single extra lookup, only when a plan exists.
      const [plan] = await db
        .select({
          key: plans.key,
          name: plans.name,
          description: plans.description,
          priceAmount: plans.priceAmount,
          priceCurrency: plans.priceCurrency,
          maxProperties: plans.maxProperties,
          maxTeamMembers: plans.maxTeamMembers,
          features: plans.features,
        })
        .from(plans)
        .where(eq(plans.key, org.planKey))
        .limit(1);

      const isActive =
        org.subscriptionStatus === "active" ||
        org.subscriptionStatus === "trialing";

      logger.info({
        event: "get_subscription_status_success",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: {
          userId: user.id,
          orgId: org.id,
          planKey: org.planKey,
          status: org.subscriptionStatus,
        },
      });

      return res.status(200).json({
        hasSubscription: true,
        isActive,
        planKey: org.planKey,
        subscriptionStatus: org.subscriptionStatus,
        currentPeriodEnd: org.currentPeriodEnd,
        entitlements: org.entitlements,
        hasBillingAccount: Boolean(org.stripeCustomerId),
        plan: plan ?? null,
      });
    } catch (error: any) {
      logger.error({
        event: "get_subscription_status_unexpected_error",
        controller: "subscriptionController",
        requestId: req.id,
        metadata: { userId: user.id },
        error: error.message,
        stack: error.stack,
      });
      return next({
        message: "Failed to fetch subscription status.",
        status: 500,
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
