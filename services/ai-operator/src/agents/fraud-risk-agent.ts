import type { FraudRiskInput, FraudRiskOutput } from "../models/agents.js";

const WEIGHTS: Record<string, number> = {
  PAYMENT_ABUSE: 1.2,
  MULTIPLE_ACCOUNTS: 1.3,
  SUSPICIOUS_BOOKING: 1.0,
  REFUND_ABUSE: 1.1,
  HIGH_CANCELLATION: 0.9,
  NEW_ACCOUNT: 0.8,
};

export function runFraudRiskAgent(input: FraudRiskInput): FraudRiskOutput {
  const reasonCodes: string[] = [];
  let score = 0.05;

  if (input.signals?.length) {
    let wSum = 0, wTotal = 0;
    for (const s of input.signals) {
      const w = WEIGHTS[s.type] ?? 1;
      wSum += s.score * w;
      wTotal += w;
      reasonCodes.push(`${s.type}:${(s.score * 100).toFixed(0)}`);
    }
    score = Math.min(1, wSum / wTotal);
  }
  if (input.paymentAttemptCount != null && input.paymentAttemptCount > 3) {
    score = Math.min(1, score + 0.2);
    reasonCodes.push("multiple_payment_attempts");
  }
  if (input.cancellationRate != null && input.cancellationRate > 0.5) {
    score = Math.min(1, score + 0.15);
    reasonCodes.push("high_cancellation_rate");
  }
  if (input.accountAgeDays != null && input.accountAgeDays < 1) {
    score = Math.min(1, score + 0.1);
    reasonCodes.push("new_account");
  }
  if (reasonCodes.length === 0) reasonCodes.push("no_signals");

  const riskLevel: FraudRiskOutput["riskLevel"] =
    score >= 0.7 ? "critical" : score >= 0.5 ? "high" : score >= 0.3 ? "medium" : "low";
  const confidence = 0.75;
  const autoFlag = riskLevel === "high" || riskLevel === "critical";
  const recommendedAction = autoFlag ? "flag_for_review" : "allow";

  return {
    fraudRiskScore: Math.round(score * 100) / 100,
    riskLevel,
    confidenceScore: confidence,
    recommendedAction,
    reasonCodes,
    escalateToHuman: autoFlag,
    autoFlag,
  };
}
