/**
 * Deterministic fraud + revenue stress scoring — no side effects.
 */

export interface FraudRevenueRiskInput {
  fraudFlag?: boolean;
  signals?: Array<{
    type: string;
    severity?: "info" | "warning" | "critical";
    metadata?: Record<string, unknown>;
  }>;
  revenueFacts?: {
    grossBookingValue30d?: number;
    refunds30d?: number;
    chargebacks30d?: number;
    payoutVolume30d?: number;
    anomalyScore?: number;
  };
}

export interface FraudRevenueRiskResult {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
  revenueImpactEstimate: number;
  requiresBlock: boolean;
  requiresApproval: boolean;
}

export function evaluateFraudRevenueRisk(input: FraudRevenueRiskInput): FraudRevenueRiskResult {
  const reasons: string[] = [];
  let score = 0;

  const gross = input.revenueFacts?.grossBookingValue30d ?? 0;
  const refunds = input.revenueFacts?.refunds30d ?? 0;
  const chargebacks = input.revenueFacts?.chargebacks30d ?? 0;
  const payoutVolume = input.revenueFacts?.payoutVolume30d ?? 0;
  const anomalyScore = input.revenueFacts?.anomalyScore ?? 0;

  if (input.fraudFlag) {
    score += 55;
    reasons.push("Fraud flag detected");
  }

  if ((input.signals ?? []).some((s) => s.type === "payout_anomaly")) {
    score += 25;
    reasons.push("Payout anomaly detected");
  }

  if ((input.signals ?? []).some((s) => s.type === "chargeback_spike")) {
    score += 35;
    reasons.push("Chargeback spike detected");
  }

  if ((input.signals ?? []).some((s) => s.type === "refund_spike")) {
    score += 20;
    reasons.push("Refund spike detected");
  }

  if (anomalyScore >= 0.9) {
    score += 35;
    reasons.push("Very high anomaly score");
  } else if (anomalyScore >= 0.75) {
    score += 20;
    reasons.push("High anomaly score");
  } else if (anomalyScore >= 0.5) {
    score += 10;
    reasons.push("Elevated anomaly score");
  }

  const refundRate = gross > 0 ? refunds / gross : 0;
  const chargebackRate = gross > 0 ? chargebacks / gross : 0;

  if (refundRate >= 0.15) {
    score += 20;
    reasons.push("High refund rate");
  } else if (refundRate >= 0.08) {
    score += 10;
    reasons.push("Elevated refund rate");
  }

  if (chargebackRate >= 0.05) {
    score += 30;
    reasons.push("High chargeback rate");
  } else if (chargebackRate >= 0.02) {
    score += 15;
    reasons.push("Elevated chargeback rate");
  }

  if (payoutVolume >= 25000 && (input.signals ?? []).some((s) => s.type === "payout_anomaly")) {
    score += 10;
    reasons.push("Large payout volume with anomaly");
  }

  score = Math.min(score, 100);

  let level: FraudRevenueRiskResult["level"] = "LOW";
  if (score >= 75) level = "CRITICAL";
  else if (score >= 50) level = "HIGH";
  else if (score >= 25) level = "MEDIUM";

  const revenueImpactEstimate = Math.max(refunds + chargebacks, payoutVolume * (anomalyScore >= 0.75 ? 0.1 : 0));

  return {
    score,
    level,
    reasons,
    revenueImpactEstimate,
    requiresBlock: level === "CRITICAL",
    requiresApproval: level === "HIGH" || level === "CRITICAL",
  };
}
