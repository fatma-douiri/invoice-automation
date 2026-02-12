import { db } from "@/infrastructure/db";
import { invoices } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { sha256 } from "@/lib/hash";
import { InvoiceStatus } from "@/domain/invoices/invoice-status";

const CreateInvoiceFromUploadKind = {
  CREATED: "CREATED",
  DUPLICATE_FILE: "DUPLICATE_FILE",
} as const;

type InvoiceRow = InferSelectModel<typeof invoices>;

export type CreateInvoiceFromUploadResult =
  | {
      kind: typeof CreateInvoiceFromUploadKind.DUPLICATE_FILE;
      fileHash: string;
      invoiceId: string;
    }
  | {
      kind: typeof CreateInvoiceFromUploadKind.CREATED;
      invoice: InvoiceRow;
    };

function isPostgresUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export async function createInvoiceFromUpload(params: {
  fileName: string;
  buffer: Buffer;
}): Promise<CreateInvoiceFromUploadResult> {
  const fileHash = sha256(params.buffer);

  // Fast path: if already present, return DUPLICATE_FILE
  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.fileHash, fileHash))
    .limit(1);

  if (existing.length > 0) {
    return {
      kind: CreateInvoiceFromUploadKind.DUPLICATE_FILE,
      fileHash,
      invoiceId: existing[0].id,
    };
  }

  // Insert can still fail due to race condition (two uploads at the same time).
  let created: InvoiceRow;

  try {
    const inserted = await db
      .insert(invoices)
      .values({
        status: InvoiceStatus.UPLOADED,
        fileName: params.fileName,
        fileHash,
      })
      .returning();

    created = inserted[0];
  } catch (err) {
    if (isPostgresUniqueViolation(err)) {
      // Another request inserted the same fileHash between our SELECT and INSERT.
      const existingAfter = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.fileHash, fileHash))
        .limit(1);

      if (existingAfter.length > 0) {
        return {
          kind: CreateInvoiceFromUploadKind.DUPLICATE_FILE,
          fileHash,
          invoiceId: existingAfter[0].id,
        };
      }
    }

    throw err;
  }

  try {
    await postInvoiceToMakeWebhook({
      invoiceId: created.id,
      fileName: params.fileName,
      fileHash,
      buffer: params.buffer,
    });

    const updatedRows = await db
      .update(invoices)
      .set({
        status: InvoiceStatus.PROCESSING,
      })
      .where(eq(invoices.id, created.id))
      .returning();

    const updated = updatedRows[0];

    return { kind: CreateInvoiceFromUploadKind.CREATED, invoice: updated };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Make webhook error";

    await db
      .update(invoices)
      .set({
        status: InvoiceStatus.ERROR,
        errorMessage: message,
      })
      .where(eq(invoices.id, created.id));

    throw err;
  }
}

async function postInvoiceToMakeWebhook(params: {
  invoiceId: string;
  fileName: string;
  fileHash: string;
  buffer: Buffer;
}) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    throw new Error("MAKE_WEBHOOK_URL is not set");
  }

  const form = new FormData();

  form.append("invoiceId", params.invoiceId);
  form.append("fileHash", params.fileHash);
  form.append("fileName", params.fileName);

  // Convert Buffer to Uint8Array to satisfy BlobPart typing in Node/TS.
  const blob = new Blob([new Uint8Array(params.buffer)], {
    type: "application/pdf",
  });
  form.append("file", blob, params.fileName);

  const res = await fetch(url, { method: "POST", body: form });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Make webhook failed (${res.status}): ${text || res.statusText}`,
    );
  }
}
