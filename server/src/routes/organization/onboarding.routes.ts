import { Router } from "express";
import { onboardingController } from "./onboarding.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { checkAuth } from "../middleware";
import { subscriptionController } from "./subscription.controller";

const router = Router();

router.post(
  "/",
  checkAuth,
  asyncHandler(onboardingController.createOrganization)
);
router.get(
  "/",
  checkAuth,
  asyncHandler(onboardingController.getMyOrganization)
);

router.post(
  "/checkout",
  checkAuth,
  asyncHandler(subscriptionController.createCheckoutSession)
);
router.get(
  "/subscription/status",
  checkAuth,
  asyncHandler(subscriptionController.getSubscriptionStatus)
);

export { router as onboardingRouter };
