import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { invoices, invoiceStatusEnum } from "./schema";

export const schema = {
  invoices,
  invoiceStatusEnum,
};

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // For serverless environments, keep max connections low.
  // Neon pooling is ON, so this is safe for local dev too.
  const client = postgres(databaseUrl, { max: 1 });
  return drizzle(client, { schema });
}

export const db = createDb();
