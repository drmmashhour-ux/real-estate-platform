import type { DealAnalyzerInput, DealConfidence, DealMetricBlock } from "./types";
import { simpleAffordabilityEstimate } from "./calculate-deal-metrics";

export type ScoreDealOutput = {
  score: number;
  confidence: DealConfidence;
  strengths: string[];
  riskFlags: string[];
};

function dataCompleteness(input: DealAnalyzerInput): number {
  let pts = 0;
  const max = 6;
  if (input.price > 0) pts += 1;
  if (input.city?.trim()) pts += 1;
  if (input.estimatedRent != null && input.estimatedRent > 0) pts += 1;
  if (input.propertyTaxAnnual != null) pts += 1;
  if (input.condoFeesMonthly != null) pts += 1;
  if (input.areaSqft != null && input.areaSqft > 0) pts += 1;
  return pts / max;
}

function confidenceFromCompleteness(c: number): DealConfidence {
  if (c >= 0.65) return "high";
  if (c >= 0.35) return "medium";
  return "low";
}

/**
 * Deterministic 0–100 score. Penalize missing rent; reward yield and cash flow; penalize tight affordability.
 */
export function scoreDeal(input: DealAnalyzerInput, metrics: DealMetricBlock): ScoreDealOutput {
  const strengths: string[] = [];
  const riskFlags: string[] = [];

  let score = 52;
  const complete = dataCompleteness(input);
  const conf = confidenceFromCompleteness(complete);

  if (input.estimatedRent == null || input.estimatedRent <= 0) {
    score -= 18;
    riskFlags.push("No rental income estimate — yield and cash flow are unknown.");
  }

  if (metrics.grossYield != null) {
    if (metrics.grossYield >= 7) {
      score += 14;
      strengths.push("Estimated gross yield looks relatively strong for this model.");
    } else if (metrics.grossYield >= 4) {
      score += 6;
      strengths.push("Estimated gross yield is in a moderate range.");
    } else {
      score -= 10;
      riskFlags.push("Estimated gross yield appears on the low side at the assumed price.");
    }
  }

  if (metrics.estimatedMonthlyCashFlow != null) {
    if (metrics.estimatedMonthlyCashFlow > 0) {
      score += 10;
      strengths.push("Estimated monthly cash flow is positive under assumptions.");
    } else if (metrics.estimatedMonthlyCashFlow < -200) {
      score -= 12;
      riskFlags.push("Estimated monthly cash flow is negative under assumptions — review costs and rent.");
    } else {
      score -= 4;
      riskFlags.push("Estimated monthly cash flow is tight or slightly negative.");
    }
  }

  const afford = simpleAffordabilityEstimate(
    input.estimatedRent,
    metrics.monthlyMortgagePayment,
    metrics.estimatedMonthlyExpenses
  );
  if (afford === "tight") {
    score -= 18;
    riskFlags.push("Debt and expense burden relative to assumed rent looks tight.");
  } else if (afford === "moderate") {
    score -= 6;
  } else if (afford === "comfortable") {
    score += 8;
    strengths.push("Assumed debt and expense burden is moderate relative to rent.");
  }

  if (input.priceIsIllustrative) {
    score -= 6;
    riskFlags.push("List price is illustrative (derived from listing signals) — treat numbers as preliminary.");
  }

  if (conf === "low") {
    score -= 8;
  } else if (conf === "high") {
    score += 4;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (strengths.length === 0) {
    strengths.push("Review assumptions and compare to similar listings in the same market.");
  }

  return { score, confidence: conf, strengths, riskFlags };
}
