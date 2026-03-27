import type { FraudCheckInput, FraudCheckOutput } from "../models/index.js";

/**
 * Fraud / booking risk scoring from signals or booking context.
 * Rule-based aggregation; can be replaced by ML model or call to platform FraudScore.
 */
export function checkFraud(input: FraudCheckInput): FraudCheckOutput {
  const factors: string[] = [];
  let score = 0;

  if (input.signals?.length) {
    const avg = input.signals.reduce((a, s) => a + s.score, 0) / input.signals.length;
    score = Math.min(1, avg * 1.1);
    input.signals.forEach((s) => factors.push(`${s.type}: ${(s.score * 100).toFixed(0)}%`));
  }

  if (input.bookingId) {
    factors.push("Booking context considered");
    if (score === 0) score = 0.1; // baseline when only bookingId provided
  }
  if (input.userId) {
    factors.push("User history considered");
    if (score < 0.3) score += 0.05;
  }

  if (score === 0) score = 0.05;
  const priority: FraudCheckOutput["priority"] = score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
  const recommendedAction: FraudCheckOutput["recommendedAction"] =
    score >= 0.7 ? "block" : score >= 0.4 ? "review" : "allow";

  return {
    riskScore: Math.round(score * 100) / 100,
    recommendedAction,
    factors: factors.length ? factors : ["No strong signals"],
    priority,
  };
}
