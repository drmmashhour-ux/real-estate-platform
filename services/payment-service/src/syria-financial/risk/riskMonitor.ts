import { randomUUID } from "node:crypto";
import { assertSyriaFinancialFeatureEnabled } from "../featureFlags.js";
import { riskSignalSchema, type SyriaRiskSignal } from "./types.js";

export function createPassiveRiskSignal(
  input: Omit<SyriaRiskSignal, "id" | "detectedAt" | "passiveMonitoringOnly">,
  detectedAt: Date = new Date(),
): SyriaRiskSignal {
  assertSyriaFinancialFeatureEnabled("FEATURE_SYRIA_RISK_ENGINE");
  const parsed = riskSignalSchema.parse(input);
  return {
    ...parsed,
    id: randomUUID(),
    detectedAt,
    passiveMonitoringOnly: true,
  };
}

export function detectDuplicatePayment(input: {
  transactionFingerprint: string;
  existingFingerprints: readonly string[];
  correlationId: string;
}): SyriaRiskSignal | null {
  if (!input.existingFingerprints.includes(input.transactionFingerprint)) return null;
  return createPassiveRiskSignal({
    type: "duplicate_payment",
    severity: "medium",
    subjectId: input.transactionFingerprint,
    correlationId: input.correlationId,
    metadata: { reason: "matching_transaction_fingerprint" },
  });
}
