import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("role", ["customer", "admin", "vendor"]);

export const userSourceEnum = pgEnum("source", [
  "google",
  "facebook",
  "whatsapp",
  "general",
]);

export const userGenderEnum = pgEnum("user_gender", [
  "male",
  "female",
  "other",
]);

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  userName: varchar("user_name", { length: 50 }),
  email: varchar("email", { length: 100 }).unique(),
  password: text("password"),
  role: userRoleEnum("role").default("customer"),
  source: userSourceEnum("source").default("general"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  gender: userGenderEnum("gender"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 100 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`now()`
  ),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  tokenHash: text("token_hash").notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  used: boolean("used").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
