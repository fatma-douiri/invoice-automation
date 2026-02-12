export const ErrorCode = {
  INVALID_REQUEST: "INVALID_REQUEST",
  DUPLICATE_FILE: "DUPLICATE_FILE",
  MAKE_WEBHOOK_FAILED: "MAKE_WEBHOOK_FAILED",
  MAKE_CALLBACK_INVALID: "MAKE_CALLBACK_INVALID",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type AppErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function makeErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): AppErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
