import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/infrastructure/db";
import { invoices } from "@/infrastructure/db/schema";

import { jsonError } from "@/lib/http-errors";
import { ErrorCode } from "@/domain/errors/app-errors";
import { createInvoiceFromUpload } from "@/application/invoices/create-invoice-from-upload";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError(
      400,
      ErrorCode.INVALID_REQUEST,
      "Expected a PDF file under form field 'file'.",
    );
  }

  if (file.type !== "application/pdf") {
    return jsonError(
      400,
      ErrorCode.INVALID_REQUEST,
      "Only PDF files are supported.",
      { receivedType: file.type },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await createInvoiceFromUpload({
      fileName: file.name,
      buffer,
    });

    if (result.kind === "DUPLICATE_FILE") {
      return jsonError(
        409,
        ErrorCode.DUPLICATE_FILE,
        "This invoice was already uploaded.",
        { fileHash: result.fileHash, invoiceId: result.invoiceId },
      );
    }

    return NextResponse.json({ invoice: result.invoice }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(500, ErrorCode.INTERNAL_ERROR, "Internal server error.", {
      reason: message,
    });
  }
}

export async function GET() {
  const rows = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(20);

  return NextResponse.json({ invoices: rows }, { status: 200 });
}
