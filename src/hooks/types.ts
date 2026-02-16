import type { InferSelectModel } from "drizzle-orm";
import { invoices } from "@/infrastructure/db/schema";

export type Invoice = InferSelectModel<typeof invoices>;
