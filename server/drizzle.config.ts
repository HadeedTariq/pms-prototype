import type { Config } from "drizzle-kit";

import { config } from "dotenv";

config();

export default {
  dialect: "postgresql",
  schema: "./src/db/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
