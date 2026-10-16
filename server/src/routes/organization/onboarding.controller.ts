import { NextFunction, Request, Response } from "express";
import { and, eq, ne, sql } from "drizzle-orm";

import { errorParser } from "@/utils/errorParser.util";
import { logger } from "@/common/middleware/requestLogger";
import { db } from "@/db/client";
import { organizations } from "@/db";
import { User } from "@/types/general";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "./onboarding.validator";

class OnboardingController {
  constructor() {
    this.createOrganization = this.createOrganization.bind(this);
    this.getMyOrganization = this.getMyOrganization.bind(this);
    this.updateOrganization = this.updateOrganization.bind(this);
    this.checkSlugAvailability = this.checkSlugAvailability.bind(this);
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  private toSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Generates a unique slug by appending -2, -3, ... if collision exists.
   * Runs inside the same transaction so concurrent inserts are safe
   * (the uniqueIndex on slug is the final guard).
   */
  private async generateUniqueSlug(base: string, tx: any): Promise<string> {
    const cleanBase = this.toSlug(base) || "org";
    let candidate = cleanBase;
    let counter = 2;

    while (true) {
      const existing = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, candidate))
        .limit(1);

      if (existing.length === 0) return candidate;

      candidate = `${cleanBase}-${counter}`;
      counter += 1;

      // Safety valve
      if (counter > 1000) {
        return `${cleanBase}-${Date.now()}`;
      }
    }
  }

  // ---------------------------------------------------------------
  // POST /onboarding/organization
  // ---------------------------------------------------------------
  async createOrganization(req: Request, res: Response, next: NextFunction) {
    logger.info({
      event: "create_organization_initiated",
      controller: "onboardingController",
      requestId: req.id,
      metadata: { userId: (req.body?.user as User)?.id },
    });

    const parsed = createOrganizationSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.warn({
        event: "create_organization_validation_failed",
        controller: "onboardingController",
        requestId: req.id,
        metadata: { errors: parsed.error },
      });
      return errorParser(parsed, res);
    }

    // `user` is injected by your auth middleware (same as auth.controller)
    const { user } = req.body as { user: User };

    const {
      title,
      slug: requestedSlug,
      description,
      type,
      country,
      currency,
      timezone,
      email,
      phone,
      website,
    } = parsed.data;

    try {
      // Guard: prevent a user from accidentally creating duplicate orgs
      // while onboarding. (Relax later when multi-org support is needed.)
      const existingOrg = await db
        .select({ id: organizations.id, slug: organizations.slug })
        .from(organizations)
        .where(eq(organizations.ownerId, user.id))
        .limit(1);

      if (existingOrg.length > 0) {
        logger.warn({
          event: "create_organization_already_exists",
          controller: "onboardingController",
          requestId: req.id,
          metadata: { userId: user.id, orgId: existingOrg[0].id },
        });
        return res.status(409).json({
          message: "You already have an organization.",
          organizationId: existingOrg[0].id,
          slug: existingOrg[0].slug,
        });
      }

      const created = await db.transaction(async (tx) => {
        const finalSlug = requestedSlug
          ? await this.generateUniqueSlug(requestedSlug, tx)
          : await this.generateUniqueSlug(title, tx);

        const [org] = await tx
          .insert(organizations)
          .values({
            ownerId: user.id,
            title,
            slug: finalSlug,
            description: description || null,
            type,
            country,
            currency,
            timezone,
            email: email || null,
            phone: phone || null,
            website: website || null,
          })
          .returning({
            id: organizations.id,
            title: organizations.title,
            slug: organizations.slug,
            type: organizations.type,
            country: organizations.country,
            currency: organizations.currency,
            timezone: organizations.timezone,
            status: organizations.status,
          });

        return org;
      });

      logger.info({
        event: "create_organization_success",
        controller: "onboardingController",
        requestId: req.id,
        metadata: { userId: user.id, orgId: created.id, slug: created.slug },
      });

      return res.status(201).json({
        message: "Organization created successfully.",
        organization: created,
      });
    } catch (error: any) {
      // Unique constraint fallback (race on slug)
      if (error.code === "23505") {
        logger.warn({
          event: "create_organization_slug_conflict",
          controller: "onboardingController",
          requestId: req.id,
          metadata: { userId: user.id },
        });
        return res.status(409).json({
          message: "That slug is already taken. Please choose another one.",
        });
      }

      logger.error({
        event: "create_organization_unexpected_error",
        controller: "onboardingController",
        requestId: req.id,
        metadata: { userId: user.id },
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      return next({
        message:
          "An unexpected error occurred while creating your organization.",
        status: 500,
      });
    }
  }

  // ---------------------------------------------------------------
  // GET /onboarding/organization/me
  // ---------------------------------------------------------------
  async getMyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = req.body as { user: User };

      const rows = await db
        .select()
        .from(organizations)
        .where(eq(organizations.ownerId, user.id))
        .limit(1);

      if (rows.length === 0) {
        return res.status(404).json({
          message: "No organization found for this user.",
        });
      }

      return res.status(200).json(rows[0]);
    } catch (error: any) {
      logger.error({
        event: "get_my_organization_error",
        controller: "onboardingController",
        requestId: req.id,
        error: error.message,
      });
      return next({
        message: "Failed to fetch organization.",
        status: 500,
      });
    }
  }

  // ---------------------------------------------------------------
  // PATCH /onboarding/organization
  // ---------------------------------------------------------------
  async updateOrganization(req: Request, res: Response, next: NextFunction) {
    const parsed = updateOrganizationSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorParser(parsed, res);
    }

    const { user } = req.body as { user: User };

    if (!user?.id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    try {
      const existing = await db
        .select({ id: organizations.id, slug: organizations.slug })
        .from(organizations)
        .where(eq(organizations.ownerId, user.id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ message: "Organization not found." });
      }

      const orgId = existing[0].id;
      const payload = parsed.data;

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, unknown> = { ...payload };

        // Re-slug if slug explicitly changed
        if (payload.slug && payload.slug !== existing[0].slug) {
          updateData.slug = await this.generateUniqueSlug(payload.slug, tx);
        }

        updateData.updatedAt = new Date();

        const [row] = await tx
          .update(organizations)
          .set(updateData)
          .where(
            and(eq(organizations.id, orgId), eq(organizations.ownerId, user.id))
          )
          .returning();

        return row;
      });

      return res.status(200).json({
        message: "Organization updated successfully.",
        organization: updated,
      });
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(409).json({
          message: "That slug is already taken.",
        });
      }

      logger.error({
        event: "update_organization_error",
        controller: "onboardingController",
        requestId: req.id,
        error: error.message,
      });

      return next({
        message: "Failed to update organization.",
        status: 500,
      });
    }
  }

  // ---------------------------------------------------------------
  // GET /onboarding/organization/slug-check?slug=xyz
  // ---------------------------------------------------------------
  async checkSlugAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.query.slug || "")
        .trim()
        .toLowerCase();

      if (!slug || slug.length < 3) {
        return res.status(400).json({
          message: "Slug must be at least 3 characters.",
        });
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return res.status(400).json({
          message: "Slug format is invalid.",
        });
      }

      const existing = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      return res.status(200).json({
        slug,
        available: existing.length === 0,
      });
    } catch (error: any) {
      logger.error({
        event: "slug_check_error",
        controller: "onboardingController",
        requestId: req.id,
        error: error.message,
      });
      return next({ message: "Failed to check slug.", status: 500 });
    }
  }
}

export const onboardingController = new OnboardingController();
