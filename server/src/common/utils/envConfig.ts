import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly, url } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:5173") }),
  SERVER_DOMAIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  DATABASE_URL: url({ devDefault: testOnly("http://localhost:3000") }),
  PASSWORD_SALT: str({ devDefault: testOnly("salt") }),
  JWT_SECRET: str({ devDefault: testOnly("secret") }),
  JWT_REFRESH_TOKEN_SECRET: str({ devDefault: testOnly("secret") }),
  JWT_ACCESS_TOKEN_SECRET: str({ devDefault: testOnly("secret") }),
  NODE_MAILER_USER: str({ devDefault: testOnly("user") }),
  SESSION_SECRET: str({ devDefault: testOnly("user") }),
  NODE_MAILER_PASSWORD: str({ devDefault: testOnly("password") }),
  GOOGLE_CLIENT_ID: str({ devDefault: testOnly("dummy") }),
  GOOGLE_CLIENT_SECRET: str({ devDefault: testOnly("dummy") }),
  FACEBOOK_CLIENT_ID: str({ devDefault: testOnly("dummy") }),
  FACEBOOK_CLIENT_SECRET: str({ devDefault: testOnly("dummy") }),
  FACEBOOK_CALLBACK_URL: str({ devDefault: testOnly("dummy") }),
  STRIPE_SECRET_KEY: str({ devDefault: testOnly("dummy") }),
  STRIPE_WEBHOOK_SECRET: str({ devDefault: testOnly("dummy") }),
  GMAIL_USER: str({ devDefault: testOnly("dummy") }),
  ENCRYPTION_KEY: str({ devDefault: testOnly("dummy") }),
  REDIRECT_URI: str({
    devDefault: testOnly("http://localhost:3000/auth/google/callback"),
  }),
});
