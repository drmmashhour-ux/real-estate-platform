export type SyriaFinancialErrorCode =
  | "SYRIA_FINANCE_DISABLED"
  | "VALIDATION_ERROR"
  | "PROVIDER_NOT_AVAILABLE"
  | "LIVE_PAYMENTS_DISABLED"
  | "IDEMPOTENCY_CONFLICT"
  | "SENSITIVE_DATA_REJECTED"
  | "ADMIN_ACCESS_REQUIRED"
  | "UNSUPPORTED_STATUS_TRANSITION";

export class SyriaFinancialError extends Error {
  readonly code: SyriaFinancialErrorCode;
  readonly statusCode: number;
  readonly correlationId?: string;

  constructor(
    code: SyriaFinancialErrorCode,
    message: string,
    options: { statusCode?: number; correlationId?: string } = {},
  ) {
    super(message);
    this.name = "SyriaFinancialError";
    this.code = code;
    this.statusCode = options.statusCode ?? 400;
    this.correlationId = options.correlationId;
  }
}

export interface SyriaFinancialErrorResponse {
  error: {
    code: SyriaFinancialErrorCode | "INTERNAL_ERROR";
    message: string;
    correlationId?: string;
  };
}

export function toSafeFinancialErrorResponse(error: unknown): {
  statusCode: number;
  body: SyriaFinancialErrorResponse;
} {
  if (error instanceof SyriaFinancialError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          correlationId: error.correlationId,
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "A financial safety control rejected the request.",
      },
    },
  };
}
