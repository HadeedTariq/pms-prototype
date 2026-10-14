import { NextFunction, Request, Response } from "express";

import { verify } from "jsonwebtoken";
import crypto from "crypto";

import { env } from "@/common/utils/envConfig";
import { hash, compare } from "bcrypt";
import {
  generateAccessAndRefreshToken,
  generateOTP,
  sendOTPEmail,
  sendResetPasswordEmail,
} from "@/utils/auth.util";
import { errorParser } from "@/utils/errorParser.util";
import {
  authSchema,
  createPasswordSchema,
  emailOtpSchema,
  forgetPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validator";
import { User } from "@/types/general";
import { logger } from "@/common/middleware/requestLogger";
import { db } from "@/db/client";
import { emailOtps, passwordResetTokens, users } from "@/db";
import { and, eq, gt } from "drizzle-orm";

class UserController {
  constructor() {
    this.authenticateUser = this.authenticateUser.bind(this);
    this.otpEmailChecker = this.otpEmailChecker.bind(this);
    this.authenticateByResfreshToken =
      this.authenticateByResfreshToken.bind(this);
    this.authenticateWithCredentials =
      this.authenticateWithCredentials.bind(this);
    this.createPassword = this.createPassword.bind(this);
    this.registerUser = this.registerUser.bind(this);
    // ! Oauth
    this.authenticate_google = this.authenticate_google.bind(this);
    this.authenticate_facebook = this.authenticate_facebook.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  async authenticate_google(req: Request, res: Response, next: NextFunction) {
    const oauthUser = req.user as User;

    if (!oauthUser?.email) {
      return res.status(404).json({
        message:
          "We couldn’t retrieve your email from Google. Please provide an alternative email address.",
      });
    }

    try {
      const existingUsers = await db
        .select({
          id: users.id,
          isVerified: users.isVerified,
          userName: users.userName,
          email: users.email,
          role: users.role,
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.email, oauthUser.email));

      if (existingUsers.length > 0) {
        const dbUser = existingUsers[0];

        const { accessToken, refreshToken } =
          generateAccessAndRefreshToken(dbUser);

        await db
          .update(users)
          .set(
            dbUser.isVerified
              ? { refreshToken }
              : { refreshToken, isVerified: true },
          )
          .where(eq(users.id, dbUser.id));

        return res
          .cookie("accessToken", accessToken, {
            secure: true,
            httpOnly: false,
            sameSite: "none",
          })
          .cookie("refreshToken", refreshToken, {
            secure: true,
            httpOnly: false,
            sameSite: "none",
          })
          .redirect(`${env.CORS_ORIGIN}/onboarding`);
      }

      let tokens;

      try {
        tokens = await db.transaction(async (tx) => {
          const [authUser] = await tx
            .insert(users)
            .values({
              userName: oauthUser.name || oauthUser.email.split("@")[0],
              email: oauthUser.email,
              isVerified: true,
              source: "google",
            })
            .returning({
              id: users.id,
              isVerified: users.isVerified,
              userName: users.userName,
              email: users.email,
              role: users.role,
              gender: users.gender,
            });

          const { accessToken, refreshToken } =
            generateAccessAndRefreshToken(authUser);

          await tx
            .update(users)
            .set({ refreshToken })
            .where(eq(users.id, authUser.id));

          return { accessToken, refreshToken };
        });
      } catch (err: any) {
        if (err.code === "23505") {
          return res.status(409).json({
            message: "A user with this email already exists.",
          });
        }
        throw err;
      }

      return res
        .cookie("accessToken", tokens.accessToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .cookie("refreshToken", tokens.refreshToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .redirect(`${env.CORS_ORIGIN}/onboarding`);
    } catch (error: any) {
      console.error("Database query error:", error);

      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "Database connection was refused. Please try again later.",
        });
      }

      return res.status(500).json({
        message: "Something went wrong while authenticating with Google.",
      });
    }
  }

  async authenticate_facebook(req: Request, res: Response, next: NextFunction) {
    const oauthUser = req.user as User;

    if (!oauthUser?.email) {
      return next({
        message:
          "We couldn’t retrieve your email from Facebook. Please provide an alternative email address.",
        status: 404,
      });
    }

    try {
      const existingUsers = await db
        .select({
          id: users.id,
          isVerified: users.isVerified,
          userName: users.userName,
          email: users.email,
          role: users.role,
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.email, oauthUser.email));

      if (existingUsers.length > 0) {
        const dbUser = existingUsers[0];

        const { accessToken, refreshToken } =
          generateAccessAndRefreshToken(dbUser);

        await db
          .update(users)
          .set(
            dbUser.isVerified
              ? { refreshToken }
              : { refreshToken, isVerified: true },
          )
          .where(eq(users.id, dbUser.id));

        return res
          .cookie("accessToken", accessToken, {
            secure: true,
            httpOnly: false,
            sameSite: "none",
          })
          .cookie("refreshToken", refreshToken, {
            secure: true,
            httpOnly: false,
            sameSite: "none",
          })
          .redirect(env.CORS_ORIGIN);
      }

      let tokens;

      try {
        tokens = await db.transaction(async (tx) => {
          const [authUser] = await tx
            .insert(users)
            .values({
              userName: oauthUser.name || oauthUser.email.split("@")[0],
              email: oauthUser.email,
              isVerified: true,
              source: "facebook",
            })
            .returning({
              id: users.id,
              isVerified: users.isVerified,
              userName: users.userName,
              email: users.email,
              role: users.role,
              gender: users.gender,
            });

          const { accessToken, refreshToken } =
            generateAccessAndRefreshToken(authUser);

          await tx
            .update(users)
            .set({ refreshToken })
            .where(eq(users.id, authUser.id));

          return { accessToken, refreshToken };
        });
      } catch (err: any) {
        if (err.code === "23505") {
          return res.status(409).json({
            message: "A user with this email already exists.",
          });
        }
        throw err;
      }

      return res
        .cookie("accessToken", tokens.accessToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .cookie("refreshToken", tokens.refreshToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .redirect(env.CORS_ORIGIN);
    } catch (error) {
      console.error("Facebook auth error:", error);
      return res.status(500).json({
        message: "Authentication failed",
      });
    }
  }

  async authenticateUser(req: Request, res: Response, next: NextFunction) {
    const { user } = req.body;

    return res.status(200).json(user);
  }
  async authenticateByResfreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { refreshToken: refToken } = req.cookies;

      if (!refToken) {
        return next({ message: "Refresh Token not found", status: 404 });
      }

      let payload: any;
      try {
        payload = verify(refToken, env.JWT_REFRESH_TOKEN_SECRET!);
      } catch {
        return next({ message: "Invalid Refresh Token", status: 404 });
      }

      const userId = payload?.id;
      if (!userId) {
        return next({ message: "Invalid Refresh Token", status: 404 });
      }

      const dbUsers = await db
        .select({
          id: users.id,
          userName: users.userName,
          email: users.email,
          role: users.role,
          gender: users.gender,
          refreshToken: users.refreshToken,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (dbUsers.length === 0) {
        return next({ status: 404, message: "User not found" });
      }

      const dbUser = dbUsers[0];

      if (dbUser.refreshToken !== refToken) {
        return next({ message: "Refresh Token revoked", status: 401 });
      }

      const { accessToken, refreshToken } =
        generateAccessAndRefreshToken(dbUser);

      await db
        .update(users)
        .set({ refreshToken })
        .where(eq(users.id, dbUser.id));

      res
        .cookie("accessToken", accessToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .cookie("refreshToken", refreshToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        });

      return res.status(200).json({
        message: "User logged in using refresh token successfully",
      });
    } catch (error) {
      console.error("Refresh token auth error:", error);
      return next({
        message: "Something went wrong",
        status: 500,
        error,
      });
    }
  }

  async logoutUser(req: Request, res: Response, next: NextFunction) {
    const { user } = req.body;
    await db
      .update(users)
      .set({ refreshToken: "" })
      .where(eq(users.id, user.id));
    res
      .clearCookie("refreshToken", {
        secure: true,
        httpOnly: false,
        sameSite: "none",
      })
      .clearCookie("accessToken", {
        secure: true,
        httpOnly: false,
        sameSite: "none",
      })
      .json({ message: "User logged out successfully" });
  }

  async createPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createPasswordSchema.safeParse(req.body);

      if (!parsed.success) {
        return errorParser(parsed, res);
      }

      const { password } = parsed.data;
      const { user } = req.body;

      if (!user?.id) {
        return res.status(400).json({
          message: "Invalid user context",
        });
      }

      const hashedPassword = await this.hashPassword(password);

      const updatedUsers = await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(and(eq(users.id, user.id), eq(users.isVerified, true)))
        .returning({ id: users.id });

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          message: "User not found or account is not verified",
        });
      }

      return res.status(200).json({
        message:
          "Password created successfully. You can now log in using your credentials.",
      });
    } catch (error) {
      next({
        message: "An error occurred while creating the password",
        error,
        status: 500,
      });
    }
  }
  async forgetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = forgetPasswordSchema.safeParse(req.body);

      if (!parsed.success) {
        return errorParser(parsed, res);
      }

      const { email } = parsed.data;

      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(200).json({
          message:
            "If an account with this email exists, a password reset link has been sent.",
        });
      }

      const user = userResult[0];

      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            eq(passwordResetTokens.used, false),
          ),
        );

      const rawToken = crypto.randomBytes(32).toString("hex");

      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const insertResult = await db
        .insert(passwordResetTokens)
        .values({
          userId: user.id,
          tokenHash,
          expiresAt,
          used: false,
        })
        .returning({ id: passwordResetTokens.id });

      if (insertResult.length === 0) {
        throw new Error("Failed to persist password reset token");
      }

      const resetPasswordUrl = `${env.CORS_ORIGIN}/authenticate/reset-password?token=${rawToken}`;

      const { success, error } = await sendResetPasswordEmail(
        email,
        resetPasswordUrl,
      );

      if (!success) {
        throw new Error(error || "Password reset email sending failed");
      }

      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (error) {
      next({
        message:
          "An error occurred while processing the password reset request",
        error,
        status: 500,
      });
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);

      if (!parsed.success) {
        return errorParser(parsed, res);
      }

      const { token, newPassword } = parsed.data;

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const tokenResult = await db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
          expiresAt: passwordResetTokens.expiresAt,
          used: passwordResetTokens.used,
        })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);

      if (tokenResult.length === 0) {
        return res.status(400).json({
          message: "Invalid or expired reset token",
        });
      }

      const resetToken = tokenResult[0];

      if (resetToken.used) {
        return res.status(400).json({
          message: "This reset token has already been used",
        });
      }

      if (resetToken.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({
          message: "Reset token has expired",
        });
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await db.transaction(async (tx) => {
        const updatedUser = await tx
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, resetToken.userId))
          .returning({ id: users.id });

        if (updatedUser.length === 0) {
          throw new Error("User password update failed");
        }

        await tx
          .update(passwordResetTokens)
          .set({ used: true })
          .where(eq(passwordResetTokens.id, resetToken.id));
      });

      return res.status(200).json({
        message: "Password has been reset successfully",
      });
    } catch (error) {
      next({
        message:
          "An error occurred while processing the password reset request",
        error,
        status: 500,
      });
    }
  }

  async authenticateWithCredentials(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      logger.info({
        event: "authenticate_with_credentials_initiated",
        controller: "authController",
        requestId: req.id,
        metadata: { email: req.body?.email },
      });

      const parsed = authSchema.safeParse(req.body);

      if (!parsed.success) {
        logger.warn({
          event: "authenticate_with_credentials_validation_failed",
          controller: "authController",
          requestId: req.id,
          metadata: { errors: parsed.error },
        });
        return errorParser(parsed, res);
      }

      const { email, password } = parsed.data;

      const usersResult = await db
        .select({
          id: users.id,
          userName: users.userName,
          email: users.email,
          password: users.password,
          role: users.role,
          isVerified: users.isVerified,
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (usersResult.length === 0) {
        logger.warn({
          event: "authenticate_with_credentials_user_not_found",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });
        return next({
          message: "No user found with the provided credentials.",
          status: 404,
        });
      }

      const user = usersResult[0];

      if (!user || !user.isVerified) {
        logger.warn({
          event: "authenticate_with_credentials_unverified_user",
          controller: "authController",
          requestId: req.id,
          metadata: { userId: user.id, email },
        });
        return next({
          message:
            "User account is not verified. Please complete verification first.",
          status: 403,
        });
      }

      const isPasswordValid = await this.verifyPassword(
        password,
        user.password || "",
      );

      if (!isPasswordValid) {
        logger.warn({
          event: "authenticate_with_credentials_invalid_password",
          controller: "authController",
          requestId: req.id,
          metadata: { email, userId: user.id },
        });
        return next({
          message: "Invalid email or password. Please try again.",
          status: 401,
        });
      }

      const { accessToken, refreshToken } = generateAccessAndRefreshToken(user);

      await db
        .update(users)
        .set({
          refreshToken,
        })
        .where(eq(users.id, user.id));

      logger.info({
        event: "authenticate_with_credentials_success",
        controller: "authController",
        requestId: req.id,
        metadata: { userId: user.id, email },
      });

      return res
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .status(200)
        .json({ message: "Authenticated successfully" });
    } catch (error: any) {
      logger.error({
        event: "authenticate_with_credentials_unexpected_error",
        controller: "authController",
        requestId: req.id,
        metadata: { email: req.body?.email },
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      return next({
        message: "Internal server error during authentication.",
        status: 500,
      });
    }
  }
  async registerUser(req: Request, res: Response, next: NextFunction) {
    logger.info({
      event: "register_user_initiated",
      controller: "authController",
      requestId: req.id,
      metadata: { email: req.body?.email },
    });

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({
        event: "register_user_validation_failed",
        controller: "authController",
        requestId: req.id,
        metadata: { errors: parsed.error },
      });
      return errorParser(parsed, res);
    }

    const { email, password, user_name, gender } = parsed.data;

    try {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        logger.warn({
          event: "register_user_email_conflict",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });

        return res.status(400).json({
          message: "A user with this email already exists.",
        });
      }

      const activeOtp = await db
        .select({ id: emailOtps.id })
        .from(emailOtps)
        .where(
          and(eq(emailOtps.email, email), gt(emailOtps.expiresAt, new Date())),
        )
        .limit(1);

      if (activeOtp.length > 0) {
        logger.warn({
          event: "register_user_throttled_otp_request",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });

        return res.status(429).json({
          message:
            "An OTP was recently sent. Please wait before requesting another one.",
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const hashedPassword = await this.hashPassword(password);

      await db.transaction(async (tx) => {
        await tx.insert(emailOtps).values({
          email,
          otp,
          expiresAt,
        });

        await tx.insert(users).values({
          email,
          password: hashedPassword,
          userName: user_name,
          gender,
        });
      });

      const { success, error } = await sendOTPEmail(email, otp);

      if (!success || error) {
        logger.error({
          event: "register_user_otp_email_failed",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });

        return res.status(502).json({
          message:
            "Failed to send OTP email. Please try again later or contact support.",
        });
      }

      logger.info({
        event: "register_user_success",
        controller: "authController",
        requestId: req.id,
        metadata: { email },
      });

      return res.status(201).json({
        message:
          "User registered successfully. OTP has been sent to your email.",
      });
    } catch (error: any) {
      logger.error({
        event: "register_user_unexpected_error",
        controller: "authController",
        requestId: req.id,
        metadata: { email },
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      if (error.code === "23505") {
        return res.status(409).json({
          message: "User already exists.",
        });
      }

      return res.status(500).json({
        message:
          "Unexpected error occurred while registering. Please try again later.",
      });
    }
  }
  async otpEmailChecker(req: Request, res: Response, next: NextFunction) {
    logger.info({
      event: "otp_email_checker_initiated",
      controller: "authController",
      requestId: req.id,
      metadata: { email: req.body?.email },
    });

    const parseResult = emailOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn({
        event: "otp_email_checker_validation_failed",
        controller: "authController",
        requestId: req.id,
        metadata: { errors: parseResult.error },
      });
      return errorParser(parseResult, res);
    }

    const { email, otp } = parseResult.data;

    try {
      const otpRows = await db
        .select({
          otp: emailOtps.otp,
        })
        .from(emailOtps)
        .where(
          and(eq(emailOtps.email, email), gt(emailOtps.expiresAt, new Date())),
        )
        .limit(1);

      if (otpRows.length === 0) {
        logger.warn({
          event: "otp_email_checker_expired_or_invalid",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });
        return next({
          message: "OTP has expired or is invalid.",
          status: 404,
        });
      }

      const storedOtp = otpRows[0].otp;

      if (Number(otp) !== Number(storedOtp)) {
        logger.warn({
          event: "otp_email_checker_incorrect_otp",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });
        return next({
          message: "Incorrect OTP entered. Please check and try again.",
          status: 400,
        });
      }

      const userRows = await db
        .select({
          id: users.id,
          userName: users.userName,
          email: users.email,
          role: users.role,
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userRows.length === 0) {
        logger.error({
          event: "otp_email_checker_user_not_found",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });
        return next({
          message: "User not found with this email.",
          status: 404,
        });
      }

      const user = userRows[0];

      let accessToken: string;
      let refreshToken: string;

      try {
        const tokens = generateAccessAndRefreshToken(user);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      } catch (tokenError: any) {
        logger.error({
          event: "otp_email_checker_token_generation_failed",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
          error: tokenError.message,
          stack: tokenError.stack,
          code: tokenError.code,
        });
        return next({
          message: "Failed to generate authentication tokens.",
          status: 500,
        });
      }

      const updatedUsers = await db
        .update(users)
        .set({
          refreshToken,
          isVerified: true,
        })
        .where(eq(users.email, email))
        .returning({ id: users.id });

      if (updatedUsers.length === 0) {
        logger.error({
          event: "otp_email_checker_failed_update_verification",
          controller: "authController",
          requestId: req.id,
          metadata: { email },
        });
        return next({
          message: "Failed to update user verification status.",
          status: 500,
        });
      }

      logger.info({
        event: "otp_email_checker_success",
        controller: "authController",
        requestId: req.id,
        metadata: { userId: user.id, email },
      });

      return res
        .cookie("accessToken", accessToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .cookie("refreshToken", refreshToken, {
          secure: true,
          httpOnly: false,
          sameSite: "none",
        })
        .status(200)
        .json({
          message: "OTP verified and user logged in successfully.",
        });
    } catch (error: any) {
      logger.error({
        event: "otp_email_checker_unexpected_error",
        controller: "authController",
        requestId: req.id,
        metadata: { email },
        error: error.message,
        stack: error.stack,
        code: error.code,
      });

      return next({
        message: "An unexpected error occurred while verifying OTP.",
        status: 500,
      });
    }
  }

  hashPassword = async (password: string): Promise<string> => {
    const hashPassword = await hash(password, 16);

    return hashPassword;
  };
  verifyPassword = async (
    password: string,
    actual_password: string,
  ): Promise<boolean> => {
    const is_correct_password = await compare(password, actual_password);
    return is_correct_password;
  };
}

export const userController = new UserController();
