import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer, // [ADDED] for propertyCount
  jsonb, // [ADDED] for entitlements
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

// [ADDED] Import the type + enum from plans schema.
// Circular import note: plans.schema.ts imports `organizations` (for subscriptions FK),
// and organizations now imports from plans.schema. Drizzle handles this fine at runtime
// because neither side uses the other during table *definition* — only as a type reference.
// If your bundler complains, import only the type (type-only import) below.
import type { PlanFeature } from "./subscriptions.schema";
import { subscriptionStatusEnum } from "./subscriptions.schema";

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "suspended",
  "pending",
]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "hotel",
  "villa",
  "apartment",
  "hostel",
  "guest_house",
  "bnb",
  "resort",
  "other",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Owner (creator). No roles/membership table yet.
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Core identity
    title: varchar("title", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),

    // Optional description
    description: text("description"),

    // Business type
    type: organizationTypeEnum("type").notNull().default("other"),

    // Locale / money — needed the moment you show rates
    country: varchar("country", { length: 2 }).notNull(), // ISO-3166 alpha-2
    currency: varchar("currency", { length: 3 }).notNull(), // ISO-4217
    timezone: varchar("timezone", { length: 64 }).notNull(), // IANA tz

    // Contact (optional at creation, editable later)
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 30 }),
    website: varchar("website", { length: 255 }),

    // Lifecycle
    status: organizationStatusEnum("status").notNull().default("active"),
    isActive: boolean("is_active").notNull().default(true),

    // -----------------------------------------------------------------
    // [ADDED] Billing / subscription cache columns
    //
    // WHY: The `requireEntitlement` middleware runs on every feature-gated
    // request. Joining `subscriptions` + `plans` on every request is slow
    // and noisy. Instead, the Stripe webhook handler keeps these columns
    // in sync with the current active subscription. Reading them is a
    // single indexed row lookup on the org the user already owns.
    //
    // SOURCE OF TRUTH stays in `subscriptions` — these are a cache.
    // Never write to these from user requests; only from the webhook.
    // -----------------------------------------------------------------

    // [ADDED] Stripe customer id for this org.
    // WHY: When creating a Checkout Session, you reuse this customer id
    // instead of creating a new one each time. Nullable because an org
    // exists before the first checkout.
    stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),

    // [ADDED] Machine key of the current plan ("starter" | "pro" | null).
    // WHY: Fast checks / display. Nullable = never subscribed.
    // Denormalized from subscriptions → plans.key
    planKey: varchar("plan_key", { length: 50 }),

    // [ADDED] Mirror of current subscription status.
    // WHY: Middleware needs to know "active" vs "past_due" vs nothing.
    // Reuses the same enum as subscriptions to avoid drift.
    subscriptionStatus: subscriptionStatusEnum("subscription_status"),

    // [ADDED] End of the current billing period.
    // WHY: UI can show "renews on X" or "expires on Y" without a join.
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

    // [ADDED] Cached feature flags from the active plan.
    // WHY: Middleware does `org.entitlements.includes("pms_integration")`
    // — no join at all. Webhook refreshes this whenever the sub changes.
    entitlements: jsonb("entitlements")
      .$type<PlanFeature[]>()
      .notNull()
      .default([]),

    // [ADDED] Fast quota counter for property limits.
    // WHY: When creating a property, we check `propertyCount < plan.maxProperties`.
    // Kept on the org so the check is one row read. The property service
    // increments/decrements this inside the same transaction as property CRUD.
    // It's a cache — the real count is `SELECT COUNT(*) FROM properties`.
    propertyCount: integer("property_count").notNull().default(0),
  },
  (table) => ({
    slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
    ownerIdx: index("organizations_owner_id_idx").on(table.ownerId),

    // [ADDED] Index for Stripe webhook lookups: "which org owns this customer?"
    // WHY: Every webhook event includes a Stripe customer id. We need a
    // fast reverse lookup. Partial unique index keeps it 1 customer : 1 org.
    stripeCustomerIdx: uniqueIndex("organizations_stripe_customer_idx").on(
      table.stripeCustomerId
    ),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
