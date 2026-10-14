import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Must be a valid email address");

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password must be less than 100 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const authSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  user_name: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  gender: z.enum(["male", "female", "other"]),
});

export const createPasswordSchema = z.object({
  password: strongPasswordSchema,
});

export const emailOtpSchema = z.object({
  email: z.email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
});

export const forgetPasswordSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(32, "Reset token is invalid")
      .max(256, "Reset token is invalid"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password is too long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
