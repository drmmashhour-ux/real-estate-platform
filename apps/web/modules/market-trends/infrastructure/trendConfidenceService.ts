import type { TrendConfidenceLevel } from "../domain/trendTypes";

export function confidenceFromSampleSize(activeListingCount: number, windowDays: number): TrendConfidenceLevel {
  const min = Math.max(3, Math.floor(windowDays / 30));
  if (activeListingCount < min) return "insufficient_data";
  if (activeListingCount < min * 2) return "low";
  if (activeListingCount < min * 4) return "medium";
  return "high";
}
