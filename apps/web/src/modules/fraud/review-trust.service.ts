import { evaluateFraudRisk } from "./fraud.engine";
import type { FraudScoreComputation } from "@/src/modules/fraud/types";

/**
 * Review/rating abuse surface — reuses review signal bundle from `riskScoringEngine`.
 */
export async function evaluateReviewTrustSignals(reviewId: string): Promise<FraudScoreComputation | null> {
  return evaluateFraudRisk("review", reviewId, { persist: true });
}
