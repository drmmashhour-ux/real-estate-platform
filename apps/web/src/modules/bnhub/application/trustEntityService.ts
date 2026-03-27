import { prisma } from "@/lib/db";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";

export type TrustEntity = { entityType: "listing" | "host" | "guest"; entityId: string };

/**
 * Computes trust, persists a `trust_scores` snapshot, and syncs host/guest profile rollups when applicable.
 */
export async function generateTrustScore(entity: TrustEntity) {
  const factors: Record<string, unknown> = {};

  if (entity.entityType === "listing") {
    const base = await generateListingTrustScore(entity.entityId);
    const fraud = await prisma.propertyFraudScore.findUnique({ where: { listingId: entity.entityId } });
    const fraudPenalty = fraud ? Math.min(40, Math.round(fraud.fraudScore * 0.35)) : 0;
    const score = Math.max(0, Math.min(100, base.score - fraudPenalty));
    factors.listing = base.breakdown;
    factors.fraudPenalty = fraudPenalty;
    factors.fraudLevel = fraud?.riskLevel ?? null;

    await prisma.bnhubTrustScoreSnapshot.create({
      data: {
        entityType: "listing",
        entityId: entity.entityId,
        score,
        factors: factors as object,
      },
    });

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: entity.entityId },
      select: { ownerId: true, verificationStatus: true },
    });
    if (listing) {
      await prisma.bnhubHostProfile.upsert({
        where: { userId: listing.ownerId },
        create: {
          userId: listing.ownerId,
          verificationStatus: String(listing.verificationStatus),
          trustScore: score,
        },
        update: {
          verificationStatus: String(listing.verificationStatus),
          trustScore: score,
        },
      });
    }

    return { score, factors, badge: score >= 75 ? "high" : score >= 50 ? "medium" : "low" };
  }

  if (entity.entityType === "host") {
    const listings = await prisma.shortTermListing.findMany({
      where: { ownerId: entity.entityId },
      select: { id: true },
    });
    let sum = 0;
    let n = 0;
    for (const l of listings) {
      const t = await generateListingTrustScore(l.id);
      sum += t.score;
      n += 1;
    }
    const score = n > 0 ? Math.round(sum / n) : 50;
    factors.listingCount = n;
    factors.avgListingTrust = n > 0 ? sum / n : null;

    await prisma.bnhubTrustScoreSnapshot.create({
      data: { entityType: "host", entityId: entity.entityId, score, factors: factors as object },
    });

    await prisma.bnhubHostProfile.upsert({
      where: { userId: entity.entityId },
      create: { userId: entity.entityId, verificationStatus: "aggregate", trustScore: score },
      update: { trustScore: score },
    });

    return { score, factors, badge: score >= 75 ? "high" : score >= 50 ? "medium" : "low" };
  }

  // guest
  const completed = await prisma.booking.count({
    where: { guestId: entity.entityId, status: "COMPLETED" },
  });
  const disputes = await prisma.dispute.count({
    where: { booking: { guestId: entity.entityId }, status: { in: ["SUBMITTED", "UNDER_REVIEW", "ESCALATED"] } },
  });
  let score = 55 + Math.min(30, completed * 3) - Math.min(40, disputes * 12);
  score = Math.max(0, Math.min(100, score));
  factors.completedStays = completed;
  factors.openDisputes = disputes;

  await prisma.bnhubTrustScoreSnapshot.create({
    data: { entityType: "guest", entityId: entity.entityId, score, factors: factors as object },
  });

  await prisma.bnhubGuestProfile.upsert({
    where: { userId: entity.entityId },
    create: { userId: entity.entityId, trustScore: score, history: { completed, disputes } as object },
    update: { trustScore: score, history: { completed, disputes } as object },
  });

  return { score, factors, badge: score >= 75 ? "high" : score >= 50 ? "medium" : "low" };
}
