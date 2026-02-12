import { NextResponse } from "next/server";
import { makeErrorResponse, type ErrorCode } from "@/domain/errors/app-errors";

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(makeErrorResponse(code, message, details), {
    status,
  });
}
