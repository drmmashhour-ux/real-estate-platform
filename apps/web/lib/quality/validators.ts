import type { ListingHealthStatus, ListingQualityLevel } from "@prisma/client";

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function qualityLevelFromScore(score: number): ListingQualityLevel {
  if (score >= 80) return "excellent";
  if (score >= 55) return "good";
  if (score >= 30) return "needs_improvement";
  return "poor";
}

export function healthStatusFromComponents(
  qualityScore: number,
  level: ListingQualityLevel,
  performanceScore: number,
  behaviorScore: number
): ListingHealthStatus {
  if (level === "excellent" && performanceScore >= 72 && behaviorScore >= 55) return "top_performer";
  if (level === "excellent" || (level === "good" && qualityScore >= 68)) return "healthy";
  if (qualityScore >= 42 || (performanceScore >= 48 && behaviorScore >= 42)) return "improving";
  return "needs_attention";
}
