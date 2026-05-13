import { randomUUID } from "node:crypto";
import { assertSyriaFinancialFeatureEnabled } from "../featureFlags.js";
import { createPayoutPreparationSchema, type CreatePayoutPreparationInput, type SyriaPayoutPreparation } from "./types.js";

export function createSyriaPayoutPreparation(
  input: CreatePayoutPreparationInput,
  now: Date = new Date(),
): SyriaPayoutPreparation {
  assertSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PAYOUTS");
  const parsed = createPayoutPreparationSchema.parse(input);
  return {
    id: randomUUID(),
    merchantId: parsed.merchantId,
    provider: parsed.provider,
    amount: parsed.amount,
    status: "pending",
    idempotencyKey: parsed.idempotencyKey,
    correlationId: parsed.correlationId,
    metadata: Object.freeze({ ...parsed.metadata }),
    liveTransferExecuted: false,
    createdAt: now,
  };
}
