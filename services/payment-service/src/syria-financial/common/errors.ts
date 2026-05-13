import type { RequestCorrelation } from "./types.js";

export type FinancialErrorCode =
  | "FEATURE_DISABLED"
  | "VALIDATION_ERROR"
  | "PROVIDER_DISABLED"
  | "PROVIDER_UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "INTERNAL_FINANCIAL_ERROR";

export class FinancialError extends Error {
  readonly code: FinancialErrorCode;
  readonly status: number;
  readonly correlationId?: string;

  constructor(code: FinancialErrorCode, message: string, status = 400, correlation?: RequestCorrelation) {
    super(message);
    this.name = "FinancialError";
    this.code = code;
    this.status = status;
    this.correlationId = correlation?.correlationId;
  }
}

export interface FinancialErrorResponse {
  error: {
    code: FinancialErrorCode;
    message: string;
    correlationId?: string;
  };
}

export function toFinancialErrorResponse(error: unknown, fallbackCorrelationId?: string): FinancialErrorResponse {
  if (error instanceof FinancialError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        correlationId: error.correlationId ?? fallbackCorrelationId,
      },
    };
  }

  return {
    error: {
      code: "INTERNAL_FINANCIAL_ERROR",
      message: "A financial operation failed safely without executing money movement.",
      correlationId: fallbackCorrelationId,
    },
  };
}
