import { Router } from "express";
import { onboardingController } from "./onboarding.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { checkAuth } from "../middleware";

const router = Router();

router.post(
  "/",
  checkAuth,
  asyncHandler(onboardingController.createOrganization),
);
router.get(
  "/",
  checkAuth,
  asyncHandler(onboardingController.getMyOrganization),
);

export { router as onboardingRouter };
