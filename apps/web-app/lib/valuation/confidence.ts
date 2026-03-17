import { CONFIDENCE_THRESHOLDS } from "./constants";
import type { ConfidenceLabel } from "./constants";

/**
 * Compute confidence score (0-100) and label from:
 * - number of comparables
 * - data completeness
 * - consistency of signals
 */
export function computeConfidenceScore(params: {
  comparableCount: number;
  dataCompleteness: number; // 0-1
  signalConsistency: number; // 0-1
  dataFreshnessDays?: number;
}): { score: number; label: ConfidenceLabel } {
  const { comparableCount, dataCompleteness, signalConsistency, dataFreshnessDays = 30 } = params;
  let score = 50;
  if (comparableCount >= 5) score += 20;
  else if (comparableCount >= 3) score += 10;
  else if (comparableCount >= 1) score += 5;
  score += Math.round(dataCompleteness * 15);
  score += Math.round(signalConsistency * 15);
  if (dataFreshnessDays <= 7) score += 5;
  else if (dataFreshnessDays <= 30) score += 2;
  score = Math.min(100, Math.max(0, score));

  let label: ConfidenceLabel = "low";
  for (const { max, label: l } of CONFIDENCE_THRESHOLDS) {
    if (score <= max) {
      label = l;
      break;
    }
  }
  return { score, label };
}

export function getDataConfidenceNote(label: ConfidenceLabel): string {
  switch (label) {
    case "high":
      return "Valuation based on sufficient comparable data and complete listing information.";
    case "medium":
      return "Valuation based on limited comparables or partial data. Consider additional research.";
    case "low":
      return "Limited data available. This estimate has high uncertainty. Professional appraisal recommended for material decisions.";
    default:
      return "Confidence could not be determined.";
  }
}
