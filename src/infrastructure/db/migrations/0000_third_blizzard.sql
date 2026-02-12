CREATE TYPE "public"."invoice_status" AS ENUM('UPLOADED', 'PROCESSING', 'DONE', 'ERROR', 'DUPLICATE');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "invoice_status" DEFAULT 'UPLOADED' NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"drive_file_id" text,
	"drive_file_url" text,
	"supplier_name" text,
	"invoice_number" text,
	"invoice_date" timestamp,
	"amount_ht" numeric(12, 2),
	"amount_tva" numeric(12, 2),
	"amount_ttc" numeric(12, 2),
	"currency" text DEFAULT 'EUR',
	"business_key" text,
	"raw_extraction" jsonb,
	"error_message" text,
	CONSTRAINT "invoices_file_hash_unique" UNIQUE("file_hash"),
	CONSTRAINT "invoices_business_key_unique" UNIQUE("business_key")
);
