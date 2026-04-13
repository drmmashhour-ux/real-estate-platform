import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeFullReputation } from "@/lib/reputation/compute-reputation-score";

export async function updateReputationScore(entityType: ReputationEntityType, entityId: string): Promise<void> {
  const r = await computeFullReputation(entityType, entityId);
  await prisma.reputationScore.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    create: {
      entityType,
      entityId,
      score: r.score,
      level: r.level,
      reviewScore: r.reviewScore,
      reliabilityScore: r.reliabilityScore,
      responsivenessScore: r.responsivenessScore,
      complaintScore: r.complaintScore,
      qualityScore: r.qualityScore,
      reasonsJson: r.reasonsJson as object,
    },
    update: {
      score: r.score,
      level: r.level,
      reviewScore: r.reviewScore,
      reliabilityScore: r.reliabilityScore,
      responsivenessScore: r.responsivenessScore,
      complaintScore: r.complaintScore,
      qualityScore: r.qualityScore,
      reasonsJson: r.reasonsJson as object,
    },
  });

  if (entityType === "listing") {
    const { scheduleListingQualityRecompute } = await import("@/lib/quality/schedule-listing-quality");
    scheduleListingQualityRecompute(entityId);
  }
}
