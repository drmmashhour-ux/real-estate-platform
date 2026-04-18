import { fraudTrustV1Flags } from "@/config/feature-flags";
import {
  computeFraudRiskScore,
  saveFraudRiskScore,
} from "@/src/modules/fraud/riskScoringEngine";
import { createOrUpdateFraudFlags } from "@/src/modules/fraud/flaggingEngine";
import type { FraudEntityType, FraudScoreComputation } from "@/src/modules/fraud/types";
import { prisma } from "@/lib/db";

export type FraudEvaluateOptions = {
  /** Persist fraud_risk_scores + flags/queue when risk elevated */
  persist?: boolean;
};

/**
 * Enterprise entrypoint — wraps deterministic signals; always explainable, never a public accusation.
 */
export async function evaluateFraudRisk(
  entityType: FraudEntityType,
  entityId: string,
  opts?: FraudEvaluateOptions,
): Promise<FraudScoreComputation | null> {
  const result = await computeFraudRiskScore(entityType, entityId);
  if (!result) return null;

  const persist = opts?.persist !== false;
  if (persist && fraudTrustV1Flags.fraudDetectionV1) {
    await saveFraudRiskScore(result);
    if (result.riskLevel !== "low") {
      await createOrUpdateFraudFlags(entityType, entityId, result);
    }
    await prisma.fraudActionLog.create({
      data: {
        entityType,
        entityId,
        actionType: "fraud_engine_v1_evaluate",
        resultJson: {
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          scoreVersion: "fraud_engine_v1",
        },
      },
    });
  }

  return result;
}
