import type { ListingQualityLevel } from "@prisma/client";
import { qualityLevelFromScore } from "@/lib/quality/validators";

export function getQualityLevelFromNumericScore(score: number): ListingQualityLevel {
  return qualityLevelFromScore(score);
}
