import type { PlatformTrustEntityType, PlatformTrustTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeBrokerTrustScore } from "@/lib/trust/compute-broker-trust";
import { computeHostTrustScore } from "@/lib/trust/compute-host-trust";
import { computeListingTrustScore } from "@/lib/trust/compute-listing-trust";
import { computeUserTrustScore } from "@/lib/trust/compute-user-trust";

export async function updatePlatformTrustScore(
  entityType: PlatformTrustEntityType,
  entityId: string
): Promise<void> {
  let computed: { score: number; level: PlatformTrustTier; reasonsJson: Prisma.InputJsonValue };

  switch (entityType) {
    case "user":
      computed = await computeUserTrustScore(entityId);
      break;
    case "host":
      computed = await computeHostTrustScore(entityId);
      break;
    case "broker":
      computed = await computeBrokerTrustScore(entityId);
      break;
    case "listing":
      computed = await computeListingTrustScore(entityId);
      break;
    default:
      return;
  }

  await prisma.platformTrustScore.upsert({
    where: {
      entityType_entityId: { entityType, entityId },
    },
    create: {
      entityType,
      entityId,
      score: computed.score,
      level: computed.level,
      reasonsJson: computed.reasonsJson as object,
    },
    update: {
      score: computed.score,
      level: computed.level,
      reasonsJson: computed.reasonsJson as object,
    },
  });

  if (entityType === "listing") {
    const { scheduleListingQualityRecompute } = await import("@/lib/quality/schedule-listing-quality");
    scheduleListingQualityRecompute(entityId);
  }
}

export const updateTrustScore = updatePlatformTrustScore;
