import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";

// Feature flags available across plans.
// Extend as product grows. Kept as a TS union for type-safety in code.
export type PlanFeature =
  | "custom_domain"
  | "pms_integration"
  | "direct_booking"
  | "analytics"
  | "remove_branding"
  | "priority_support";

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Stable machine key — use this in code, never the UUID.
    // e.g. "starter", "pro"
    key: varchar("key", { length: 50 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Stripe price id (price_xxx). One price per plan for now.
    // If you later add monthly/yearly, move to a separate prices table.
    stripePriceId: varchar("stripe_price_id", { length: 100 }).notNull(),

    // Price in minor units (cents/paise) to avoid floats
    priceAmount: integer("price_amount").notNull(),
    priceCurrency: varchar("price_currency", { length: 3 }).notNull(),

    // null = unlimited
    maxProperties: integer("max_properties"),
    maxTeamMembers: integer("max_team_members"),

    // Structured feature list — the middleware reads this
    features: jsonb("features").$type<PlanFeature[]>().notNull().default([]),

    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    keyIdx: uniqueIndex("plans_key_idx").on(table.key),
    stripePriceIdx: uniqueIndex("plans_stripe_price_idx").on(
      table.stripePriceId,
    ),
  }),
);

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),

    // Stripe identifiers
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 100,
    }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 100 }).notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 100 }).notNull(),

    status: subscriptionStatusEnum("status").notNull(),

    // Billing period — mirror from Stripe for gating logic
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

    // Trial / cancellation
    trialStart: timestamp("trial_start", { withTimezone: true }),
    trialEnd: timestamp("trial_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),

    // Stripe metadata blob for debugging
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    stripeSubIdx: uniqueIndex("subscriptions_stripe_sub_idx").on(
      table.stripeSubscriptionId,
    ),
    orgIdx: index("subscriptions_org_idx").on(table.organizationId),
    // Partial unique index enforced in a raw SQL migration:
    //   CREATE UNIQUE INDEX subscriptions_one_active_per_org
    //   ON subscriptions (organization_id)
    //   WHERE status IN ('trialing','active','past_due','paused');
  }),
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export const subscriptionEvents = pgTable(
  "subscription_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Stripe event id (evt_xxx) — used for idempotency
    stripeEventId: varchar("stripe_event_id", { length: 100 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),

    // Optional linkage
    organizationId: uuid("organization_id"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),

    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),

    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: varchar("error", { length: 500 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventIdx: uniqueIndex("subscription_events_event_id_idx").on(
      table.stripeEventId,
    ),
    orgIdx: index("subscription_events_org_idx").on(table.organizationId),
  }),
);
