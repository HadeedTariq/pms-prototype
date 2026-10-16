import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler, {
  reqErrorHandler,
} from "@/common/middleware/errorHandler";
import requestLogger from "./common/middleware/requestLogger";
import { authRouter } from "./routes/auth/auth.routes";

import cookieParser from "cookie-parser";

import session from "express-session";

import { env } from "./common/utils/envConfig";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import {
  Strategy as FacebookStrategy,
  VerifyFunction,
  Profile as FacebookProfile,
} from "passport-facebook";
import { asyncHandler } from "./utils/asyncHandler";
import { onboardingRouter } from "./routes/organization/onboarding.routes";
import { db } from "./db/client";
import { sql } from "drizzle-orm";
import { stripeWebhookHandler } from "./webhooks/stripe.webhook";

const app: Express = express();

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

app.set("trust proxy", true);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
  })
);
app.use(helmet());
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

interface User {
  name: string;
  email: string;
  photo: string;
}

// db.execute(
//   sql`
//     delete from subscriptions where created_at < NOW()

//   `
// ).then((user) => {
//   console.log("====================================");
//   console.log(user.rows);
//   console.log("====================================");
// });

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.REDIRECT_URI,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const user: User = {
          name: profile.displayName,
          email: profile.emails?.[0]?.value || "",
          photo: profile.photos?.[0]?.value || "",
        };

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

const verifyCallback: VerifyFunction = (
  accessToken: string,
  refreshToken: string,
  profile: FacebookProfile,
  done: (error: any, user?: any) => void
): void => {
  try {
    const user: User = {
      name: profile.displayName,
      email: profile.emails?.[0]?.value || "",
      photo: profile.photos?.[0]?.value || "",
    };

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

passport.use(
  new FacebookStrategy(
    {
      clientID: env.FACEBOOK_CLIENT_ID || "",
      clientSecret: env.FACEBOOK_CLIENT_SECRET || "",
      callbackURL: env.FACEBOOK_CALLBACK_URL || "",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    verifyCallback
  )
);

passport.serializeUser((user: any, done: (error: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser(
  (user: User, done: (error: any, user?: any) => void) => {
    done(null, user);
  }
);

app.use(requestLogger);

app.use("/auth", authRouter);
app.use("/onboarding", onboardingRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());
app.use(reqErrorHandler);

export { app };
