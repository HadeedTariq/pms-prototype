import { Router } from "express";
import { userController } from "./auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import passport from "passport";
import { checkAuth } from "../middleware";
import { env } from "@/common/utils/envConfig";

const router = Router();

router.get("/", checkAuth, asyncHandler(userController.authenticateUser));
router.post("/logout", checkAuth, asyncHandler(userController.logoutUser));
router.post(
  "/refreshAccessToken",
  asyncHandler(userController.authenticateByResfreshToken),
);
router.post(
  "/authenticate-with-credentials",
  asyncHandler(userController.authenticateWithCredentials),
);
router.post("/register", asyncHandler(userController.registerUser));
router.post("/otp-email-checker", asyncHandler(userController.otpEmailChecker));

router.get("/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${env.REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(url);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  asyncHandler(userController.authenticate_google),
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/",
  }),
  asyncHandler(userController.authenticate_facebook),
);

router.post("/forgot-password", asyncHandler(userController.forgetPassword));
router.post("/reset-password", asyncHandler(userController.resetPassword));

router.use(checkAuth);
router.post("/create-password", asyncHandler(userController.createPassword));

export { router as authRouter };
