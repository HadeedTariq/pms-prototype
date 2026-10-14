// utils/stripe.ts
import { env } from "@/common/utils/envConfig";
import Stripe from "stripe";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // Optional: Identifies your integration in Stripe Dashboard logs
  appInfo: {
    name: "MyEcommerceApp",
    version: "1.0.0",
  },
  // Recommended: Automatically retry requests that fail due to network drops
  maxNetworkRetries: 2,
});
