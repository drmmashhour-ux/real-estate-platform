/**
 * Conservative 0–100 score — penalizes low samples and incomplete channels.
 * Higher score ≠ proven effectiveness; internal triage only.
 */

import type { FastDealCityMetrics } from "@/modules/growth/fast-deal-city-comparison.types";

export type CityPerformanceScoreResult = {
  score: number;
  confidence: "low" | "medium" | "high";
  warnings: string[];
};

/**
 * Normalized weighted score from available derived rates only:
 * - playbookCompletionRate × up to 35 pts
 * - progressionRate × up to 35 pts
 * - captureRate × up to 15 pts
 * - closeRate × up to 15 pts (only when sampleSize ≥ 15)
 *
 * Base = sum(weights × rate) / sum(weights) × 100, then multiply completeness and sample factors.
 */
export function computeCityPerformanceScore(
  metrics: FastDealCityMetrics & { derived: FastDealCityMetrics["derived"] },
): CityPerformanceScoreResult {
  const warnings: string[] = [...metrics.meta.warnings];
  const n = metrics.meta.sampleSize;
  const d = metrics.derived;

  let sum = 0;
  let maxPts = 0;

  if (d.playbookCompletionRate != null) {
    sum += 35 * d.playbookCompletionRate;
    maxPts += 35;
  } else {
    warnings.push("Playbook completion rate unavailable — missing playbook start/complete counts.");
  }

  if (d.progressionRate != null) {
    sum += 35 * d.progressionRate;
    maxPts += 35;
  } else {
    warnings.push("Progression rate unavailable — need deals progressed and captured leads in-window.");
  }

  if (d.captureRate != null) {
    sum += 15 * d.captureRate;
    maxPts += 15;
  } else {
    warnings.push("Capture rate unavailable — need sourcing sessions and captured leads.");
  }

  if (d.closeRate != null && n >= 15) {
    sum += 15 * d.closeRate;
    maxPts += 15;
  } else if (d.closeRate != null && n < 15) {
    warnings.push("Close rate excluded from weighted score — sample below threshold (15).");
  } else {
    warnings.push("Close rate unavailable — missing closed deals or captures.");
  }

  const basePct = maxPts > 0 ? (sum / maxPts) * 100 : 0;

  let comp = 1;
  if (metrics.meta.dataCompleteness === "medium") comp = 0.88;
  if (metrics.meta.dataCompleteness === "low") comp = 0.72;

  let samplePen = 0.68;
  if (n >= 40) samplePen = 1;
  else if (n >= 25) samplePen = 0.92;
  else if (n >= 12) samplePen = 0.82;

  if (n < 12) warnings.push("Very small attributed sample — score discounted.");

  let score = Math.round(Math.min(100, Math.max(0, basePct * comp * samplePen)));

  let confidence: "low" | "medium" | "high" = "low";
  if (n >= 40 && metrics.meta.dataCompleteness === "high") confidence = "high";
  else if (n >= 18 && metrics.meta.dataCompleteness !== "low") confidence = "medium";

  return { score, confidence, warnings };
}
