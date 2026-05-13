import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  requestCorrelationSchema,
} from "../common/types.js";
import { isSyriaFinancialFeatureEnabled, type SyriaFinancialFeatureFlags } from "../common/featureFlags.js";
import { sanitizeFinancialMetadata } from "../common/security.js";

export const riskSignalTypes = [
  "duplicate_payment",
  "velocity",
  "suspicious_ip",
  "repeated_failure",
  "provider_anomaly",
] as const;

export const riskSignalSchema = z.object({
  id: financialIdSchema,
  signalType: z.enum(riskSignalTypes),
  subjectId: financialIdSchema,
  correlation: requestCorrelationSchema,
  severity: z.enum(["low", "medium", "high"]),
  passiveOnly: z.literal(true),
  metadata: financialMetadataSchema,
  observedAt: z.string().datetime({ offset: true }),
});

export type RiskSignal = z.infer<typeof riskSignalSchema>;

export interface RiskEvaluationInput {
  subjectId: string;
  idempotencyKey?: string;
  recentIdempotencyKeys?: readonly string[];
  paymentAttemptsInWindow?: number;
  failureCountInWindow?: number;
  ipAddress?: string;
  suspiciousIpAddresses?: readonly string[];
  providerFailureRatePercent?: number;
  correlation: RiskSignal["correlation"];
}

export function evaluateSyriaRiskSignals(
  input: RiskEvaluationInput,
  flags?: SyriaFinancialFeatureFlags,
): readonly RiskSignal[] {
  if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_RISK_ENGINE", flags)) {
    return [];
  }

  const signals: RiskSignal[] = [];
  const addSignal = (signalType: RiskSignal["signalType"], severity: RiskSignal["severity"], metadata = {}) => {
    signals.push(
      riskSignalSchema.parse({
        id: randomUUID(),
        signalType,
        subjectId: input.subjectId,
        correlation: input.correlation,
        severity,
        passiveOnly: true,
        metadata: sanitizeFinancialMetadata(financialMetadataSchema.parse(metadata)),
        observedAt: nowIso(),
      }),
    );
  };

  if (input.idempotencyKey && input.recentIdempotencyKeys?.includes(input.idempotencyKey)) {
    addSignal("duplicate_payment", "medium", { idempotencyKey: input.idempotencyKey });
  }
  if ((input.paymentAttemptsInWindow ?? 0) >= 5) {
    addSignal("velocity", "medium", { paymentAttemptsInWindow: input.paymentAttemptsInWindow ?? 0 });
  }
  if (input.ipAddress && input.suspiciousIpAddresses?.includes(input.ipAddress)) {
    addSignal("suspicious_ip", "high", { ipAddress: input.ipAddress });
  }
  if ((input.failureCountInWindow ?? 0) >= 3) {
    addSignal("repeated_failure", "medium", { failureCountInWindow: input.failureCountInWindow ?? 0 });
  }
  if ((input.providerFailureRatePercent ?? 0) >= 20) {
    addSignal("provider_anomaly", "high", { providerFailureRatePercent: input.providerFailureRatePercent ?? 0 });
  }

  return freezeFinancialRecord(signals);
}
