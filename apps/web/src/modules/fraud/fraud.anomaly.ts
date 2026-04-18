import type { FraudRiskLevel } from "@/src/modules/fraud/types";
import { classifyRiskLevel } from "@/src/modules/fraud/riskScoringEngine";

export type CompositeRiskInput = {
  /** 0–1 anomaly detectors (price, dup text, media) */
  anomalyScore: number;
  /** 0–1 behavior (sessions, velocity) */
  behaviorScore: number;
  /** 0–1 account/listing history */
  historyScore: number;
  /** 0–1 network / shared device/IP proxies */
  networkScore: number;
};

const W = { anomaly: 0.32, behavior: 0.24, history: 0.26, network: 0.18 };

/**
 * Weighted composite — still 0–1, then mapped to bands via existing classifier.
 */
export function computeCompositeRiskScore(input: CompositeRiskInput): {
  riskScore: number;
  riskLevel: FraudRiskLevel;
  explanation: string[];
} {
  const riskScore = Math.min(
    1,
    input.anomalyScore * W.anomaly +
      input.behaviorScore * W.behavior +
      input.historyScore * W.history +
      input.networkScore * W.network,
  );
  const explanation = [
    `composite=${riskScore.toFixed(3)}`,
    `terms: anomaly=${input.anomalyScore.toFixed(2)} behavior=${input.behaviorScore.toFixed(2)} history=${input.historyScore.toFixed(2)} network=${input.networkScore.toFixed(2)}`,
  ];
  return {
    riskScore,
    riskLevel: classifyRiskLevel(riskScore),
    explanation,
  };
}
