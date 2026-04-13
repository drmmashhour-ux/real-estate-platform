import type { Prisma, ReputationLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampInt } from "@/lib/quality/validators";

export type TrustScoreResult = { score: number; detail: Prisma.InputJsonValue };

function repLevelWeight(level: ReputationLevel | undefined): number {
  switch (level) {
    case "excellent":
      return 92;
    case "good":
      return 78;
    case "fair":
      return 58;
    case "poor":
      return 32;
    default:
      return 52;
  }
}

export async function computeTrustScoreComponent(listingId: string): Promise<TrustScoreResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, listingVerificationStatus: true },
  });
  if (!listing) {
    return { score: 40, detail: { error: "listing_not_found" } };
  }

  const [listingTrust, hostTrust, listingRep, hostRep, fraudRows, openFraudFlags] = await Promise.all([
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "listing", entityId: listingId } },
      select: { score: true, level: true },
    }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "host", entityId: listing.ownerId } },
      select: { score: true, level: true },
    }),
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType: "listing", entityId: listingId } },
      select: { score: true, level: true },
    }),
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType: "host", entityId: listing.ownerId } },
      select: { score: true, level: true },
    }),
    prisma.fraudRiskScore.findFirst({
      where: { entityType: "listing", entityId: listingId },
      select: { riskScore: true, riskLevel: true },
    }),
    prisma.bnhubFraudFlag.count({
      where: { listingId, status: "OPEN" },
    }),
  ]);

  const detail: Record<string, unknown> = {
    engine: "listing_trust_blend_v1",
    verificationStatus: listing.listingVerificationStatus,
  };

  const lt = listingTrust?.score ?? 50;
  const ht = hostTrust?.score ?? 50;
  let score = clampInt(lt * 0.55 + ht * 0.45, 0, 100);

  const lr = listingRep != null ? listingRep.score : repLevelWeight(undefined);
  const hr = hostRep != null ? hostRep.score : repLevelWeight(undefined);
  const repBlend = clampInt(lr * 0.45 + hr * 0.55, 0, 100);
  score = clampInt(score * 0.52 + repBlend * 0.48, 0, 100);

  detail.platformTrustListing = listingTrust;
  detail.platformTrustHost = hostTrust;
  detail.reputationListing = listingRep;
  detail.reputationHost = hostRep;

  if (listing.listingVerificationStatus === "VERIFIED") score = Math.min(100, score + 6);

  if (fraudRows) {
    detail.fraudRisk = fraudRows;
    const pen = clampInt(fraudRows.riskScore * 0.35, 0, 40);
    score = Math.max(5, score - pen);
  }
  if (openFraudFlags > 0) {
    detail.openBnhubFraudFlags = openFraudFlags;
    score = Math.max(5, score - Math.min(28, openFraudFlags * 7));
  }

  return {
    score: clampInt(score, 0, 100),
    detail: detail as Prisma.InputJsonValue,
  };
}
