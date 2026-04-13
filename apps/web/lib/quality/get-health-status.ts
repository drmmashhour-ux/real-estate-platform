import type { ListingHealthStatus, ListingQualityLevel } from "@prisma/client";
import { healthStatusFromComponents } from "@/lib/quality/validators";

export function getHealthStatusFromScores(
  qualityScore: number,
  level: ListingQualityLevel,
  performanceScore: number,
  behaviorScore: number
): ListingHealthStatus {
  return healthStatusFromComponents(qualityScore, level, performanceScore, behaviorScore);
}
