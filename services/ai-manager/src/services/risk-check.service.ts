import type { RiskCheckInput, RiskCheckOutput } from "../models/index.js";

const SIGNAL_WEIGHTS: Record<string, number> = {
  PAYMENT_FRAUD: 1.2,
  MULTIPLE_ACCOUNTS: 1.3,
  SUSPICIOUS_BOOKING: 1.0,
  UNUSUAL_PAYMENT: 1.1,
  HIGH_CANCELLATION: 0.9,
  NEW_ACCOUNT: 0.7,
};

/**
 * Fraud risk score from booking/user context and optional signals.
 */
export function runRiskCheck(input: RiskCheckInput): RiskCheckOutput {
  const factors: string[] = [];
  let score = 0.05;

  if (input.signals?.length) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const s of input.signals) {
      const w = SIGNAL_WEIGHTS[s.type] ?? 1;
      weightedSum += s.score * w;
      weightTotal += w;
      factors.push(`${s.type}: ${(s.score * 100).toFixed(0)}%`);
    }
    score = Math.min(1, weightedSum / weightTotal);
  }

  if (input.paymentAttempts != null && input.paymentAttempts > 3) {
    score = Math.min(1, score + 0.2);
    factors.push("Multiple payment attempts");
  }
  if (input.accountAgeDays != null && input.accountAgeDays < 1) {
    score = Math.min(1, score + 0.15);
    factors.push("New account");
  }
  if (input.bookingId) factors.push("Booking context included");
  if (input.userId) factors.push("User history included");

  if (factors.length === 0) factors.push("No strong risk signals");

  const priority: RiskCheckOutput["priority"] =
    score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
  const recommendedAction: RiskCheckOutput["recommendedAction"] =
    score >= 0.7 ? "block" : score >= 0.4 ? "review" : "allow";

  return {
    fraudRiskScore: Math.round(score * 100) / 100,
    recommendedAction,
    factors,
    priority,
  };
}
