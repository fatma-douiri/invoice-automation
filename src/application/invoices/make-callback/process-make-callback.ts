import { and, eq, ne } from "drizzle-orm";

import { db } from "@/infrastructure/db";
import { invoices } from "@/infrastructure/db/schema";
import { sha256 } from "@/lib/hash";
import { InvoiceStatus } from "@/domain/invoices/invoice-status";
import type { MakeCallbackInput } from "./make-callback.schema";

const computeBusinessKey = (input: {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  amountTTC: number;
  currency: string;
}) => {
  const normalized = [
    input.supplierName.trim().toLowerCase(),
    input.invoiceNumber.trim().toLowerCase(),
    input.invoiceDate,
    input.amountTTC.toFixed(2),
    input.currency.trim().toUpperCase(),
  ].join("|");

  return sha256(Buffer.from(normalized));
};

const toPgNumeric = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return value.toFixed(2);
};

export const processMakeCallback = async (
  input: MakeCallbackInput,
): Promise<boolean> => {
  const [row] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.id, input.invoiceId))
    .limit(1);

  if (!row) return false;

  const extracted = input.extracted;

  if (input.status === "ERROR") {
    await db
      .update(invoices)
      .set({
        status: InvoiceStatus.ERROR,
        errorMessage: input.errorMessage ?? "Unknown Make error",
        rawExtraction: {
          extracted: extracted ?? null,
          rawText: input.rawText ?? null,
        },
      })
      .where(eq(invoices.id, input.invoiceId));

    return true;
  }

  let businessKey: string | null = null;
  let isDuplicate = false;

  const hasBusinessFields =
    !!extracted?.supplierName &&
    !!extracted?.invoiceNumber &&
    !!extracted?.invoiceDate &&
    extracted?.amountTTC != null &&
    !!extracted?.currency;

  if (hasBusinessFields) {
    businessKey = computeBusinessKey({
      supplierName: extracted!.supplierName!,
      invoiceNumber: extracted!.invoiceNumber!,
      invoiceDate: extracted!.invoiceDate!,
      amountTTC: extracted!.amountTTC!,
      currency: extracted!.currency!,
    });

    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessKey, businessKey),
          ne(invoices.id, input.invoiceId),
        ),
      )
      .limit(1);

    isDuplicate = !!existing;
  }

  await db
    .update(invoices)
    .set({
      status: isDuplicate ? InvoiceStatus.DUPLICATE : InvoiceStatus.DONE,

      driveFileId: input.driveFileId ?? null,
      driveFileUrl: input.driveFileUrl ?? null,

      supplierName: extracted?.supplierName ?? null,
      invoiceNumber: extracted?.invoiceNumber ?? null,
      invoiceDate: extracted?.invoiceDate ?? null,

      amountHT: toPgNumeric(extracted?.amountHT),
      amountTVA: toPgNumeric(extracted?.amountTVA),
      amountTTC: toPgNumeric(extracted?.amountTTC),

      currency: extracted?.currency ?? "EUR",

      businessKey: isDuplicate ? null : businessKey,

      rawExtraction: {
        extracted: extracted ?? null,
        rawText: input.rawText ?? null,
      },

      errorMessage: null,
    })
    .where(eq(invoices.id, input.invoiceId));

  return true;
};
