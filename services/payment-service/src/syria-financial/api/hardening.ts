import { z } from "zod";
import { SyriaFinancialError, toSafeFinancialErrorResponse } from "../errors.js";
import { redactFinancialSecrets } from "../security.js";

export const financialIdempotencyHeaderSchema = z.string().trim().min(16).max(128);

export interface FinancialApiSafetyContext {
  correlationId: string;
  idempotencyKey?: string;
  rateLimitBucket: string;
  providerIsolated: true;
}

export function createFinancialApiSafetyContext(input: {
  correlationId: string;
  idempotencyKey?: string;
  rateLimitBucket: string;
}): FinancialApiSafetyContext {
  if (input.idempotencyKey) {
    const parsed = financialIdempotencyHeaderSchema.safeParse(input.idempotencyKey);
    if (!parsed.success) {
      throw new SyriaFinancialError("VALIDATION_ERROR", "Invalid idempotency key.", {
        statusCode: 400,
        correlationId: input.correlationId,
      });
    }
  }

  return {
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    rateLimitBucket: input.rateLimitBucket,
    providerIsolated: true,
  };
}

export function safeFinancialLogPayload(payload: unknown) {
  return redactFinancialSecrets(payload);
}

export { toSafeFinancialErrorResponse };
