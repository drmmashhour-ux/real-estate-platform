import type { ListingHealthStatus, ListingQualityLevel } from "@prisma/client";

/** Public pill label for search cards / listing hero — only when thresholds match. */
export function listingQualityBadgeLabelFromRow(row: {
  level: ListingQualityLevel;
  qualityScore: number;
  healthStatus: ListingHealthStatus;
}): string | null {
  if (row.level !== "excellent" && row.level !== "good") return null;
  if (row.qualityScore < 62) return null;
  if (row.level === "excellent") return "Top quality";
  return row.healthStatus === "healthy" || row.healthStatus === "top_performer"
    ? "High quality"
    : "Quality stay";
}

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
