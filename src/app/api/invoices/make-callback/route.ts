import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http-errors";
import { ErrorCode } from "@/domain/errors/app-errors";

import { makeCallbackSchema } from "@/application/invoices/make-callback/make-callback.schema";
import { processMakeCallback } from "@/application/invoices/make-callback/process-make-callback";

const validateMakeSecret = (req: Request): boolean => {
  const expected = process.env.MAKE_CALLBACK_SECRET;
  if (!expected) return false;

  const provided = req.headers.get("x-make-secret");
  return provided === expected;
};

export async function POST(req: Request) {
  if (!validateMakeSecret(req)) {
    return jsonError(401, ErrorCode.MAKE_CALLBACK_INVALID, "Unauthorized.");
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError(
      400,
      ErrorCode.MAKE_CALLBACK_INVALID,
      "Invalid JSON body.",
    );
  }

  const parsed = makeCallbackSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(
      400,
      ErrorCode.MAKE_CALLBACK_INVALID,
      "Invalid callback payload.",
      { issues: parsed.error.issues },
    );
  }

  try {
    await processMakeCallback(parsed.data);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(
      500,
      ErrorCode.INTERNAL_ERROR,
      "Callback processing failed.",
      { reason: message },
    );
  }
}
