import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FinancialError, toFinancialErrorResponse } from "../common/errors.js";
import { financialIdSchema, requestCorrelationSchema, type RequestCorrelation } from "../common/types.js";

export const financialApiHeadersSchema = z.object({
  "x-correlation-id": financialIdSchema.optional(),
  "idempotency-key": financialIdSchema.optional(),
});

export const financialRateLimitPolicy = Object.freeze({
  namespace: "syria_financial",
  windowMs: 60_000,
  maxRequests: 60,
  keyFields: ["actorId", "ipAddress"],
});

export function buildFinancialRequestCorrelation(headers: unknown): RequestCorrelation {
  const parsed = financialApiHeadersSchema.parse(headers);
  return requestCorrelationSchema.parse({
    correlationId: parsed["x-correlation-id"] ?? randomUUID(),
    idempotencyKey: parsed["idempotency-key"],
  });
}

export function requireIdempotencyKey(correlation: RequestCorrelation): string {
  if (!correlation.idempotencyKey) {
    throw new FinancialError("VALIDATION_ERROR", "Financial requests require an Idempotency-Key header.", 400, correlation);
  }
  return correlation.idempotencyKey;
}

export function formatFinancialApiError(error: unknown, correlationId?: string) {
  return toFinancialErrorResponse(error, correlationId);
}
