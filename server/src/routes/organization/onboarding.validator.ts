import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters long")
  .max(150, "Slug must be less than 150 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)",
  );

export const createOrganizationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Organization title must be at least 2 characters long")
    .max(150, "Organization title must be less than 150 characters"),

  // Optional — if not sent, backend derives it from title
  slug: slugSchema.optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  type: z.enum(
    [
      "hotel",
      "villa",
      "apartment",
      "hostel",
      "guest_house",
      "bnb",
      "resort",
      "other",
    ],
    { message: "Invalid organization type" },
  ),

  country: z
    .string()
    .trim()
    .length(2, "Country must be a 2-letter ISO code (e.g., US, PK)")
    .regex(/^[A-Za-z]{2}$/, "Country must contain only letters")
    .transform((val) => val.toUpperCase()),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code (e.g., USD, PKR)")
    .regex(/^[A-Za-z]{3}$/, "Currency must contain only letters")
    .transform((val) => val.toUpperCase()),

  timezone: z
    .string()
    .trim()
    .min(3, "Timezone is required")
    .max(64, "Timezone is too long"),

  email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(30, "Phone must be less than 30 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .url("Website must be a valid URL")
    .max(255, "Website must be less than 255 characters")
    .optional()
    .or(z.literal("")),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
