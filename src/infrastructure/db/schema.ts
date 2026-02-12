import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  jsonb,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "UPLOADED",
  "PROCESSING",
  "DONE",
  "ERROR",
  "DUPLICATE",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),

  status: invoiceStatusEnum("status").notNull().default("UPLOADED"),

  fileName: text("file_name").notNull(),
  fileHash: text("file_hash").notNull().unique(),

  driveFileId: text("drive_file_id"),
  driveFileUrl: text("drive_file_url"),

  supplierName: text("supplier_name"),
  invoiceNumber: text("invoice_number"),
  invoiceDate: date("invoice_date"),

  amountHT: numeric("amount_ht", { precision: 12, scale: 2 }),
  amountTVA: numeric("amount_tva", { precision: 12, scale: 2 }),
  amountTTC: numeric("amount_ttc", { precision: 12, scale: 2 }),
  currency: text("currency").default("EUR"),

  businessKey: text("business_key").unique(),
  rawExtraction: jsonb("raw_extraction"),
  errorMessage: text("error_message"),
});
