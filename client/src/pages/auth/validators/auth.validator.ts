import { z } from "zod";

// Register Validator
export const registerValidator = z.object({
  username: z
    .string()
    .max(100, { message: "Username must be 100 characters or fewer" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(100, { message: "Email must be 100 characters or fewer" }),
  name: z
    .string()
    .max(100, { message: "Name must be 100 characters or fewer" }),
  password: z
    .string()
    .max(100, { message: "Name must be 100 characters or fewer" }),
  profession: z
    .string()
    .max(100, { message: "Profession must be 100 characters or fewer" }),
});

// Login Validator
export const loginValidator = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(100, { message: "Email must be 100 characters or fewer" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password must be less than 20 characters long" }),
});

// Types
export type RegisterValidator = z.infer<typeof registerValidator>;
export type LoginValidator = z.infer<typeof loginValidator>;
