import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/infrastructure/db/schema.ts",
  out: "./src/infrastructure/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
