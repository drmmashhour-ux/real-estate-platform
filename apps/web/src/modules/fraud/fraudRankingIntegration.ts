import { prisma } from "@/lib/db";
import { isFraudSoftRankingPenaltyEnabled } from "@/src/modules/fraud/fraudEnv";

/** Internal-only soft penalty points subtracted from ranking total when env enabled. */
export async function getBnhubListingFraudRankingAdjustment(listingId: string): Promise<{
  totalPenalty: number;
  metadataPatch: Record<string, unknown>;
}> {
  if (!isFraudSoftRankingPenaltyEnabled()) return { totalPenalty: 0, metadataPatch: {} };
  const row = await prisma.fraudRiskScore.findUnique({
    where: {
      entityType_entityId: { entityType: "listing", entityId: listingId },
    },
    select: { riskLevel: true, riskScore: true },
  });
  if (!row || (row.riskLevel !== "high" && row.riskLevel !== "critical")) {
    return { totalPenalty: 0, metadataPatch: {} };
  }
  const penalty = row.riskLevel === "critical" ? 14 : 8;
  return {
    totalPenalty: penalty,
    metadataPatch: {
      lecipmFraudSoftPenalty: {
        points: penalty,
        riskLevel: row.riskLevel,
        riskScore: row.riskScore,
      },
    },
  };
}

export async function getBnhubFraudPenaltyMap(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!isFraudSoftRankingPenaltyEnabled() || listingIds.length === 0) return map;
  const rows = await prisma.fraudRiskScore.findMany({
    where: {
      entityType: "listing",
      entityId: { in: listingIds },
      riskLevel: { in: ["high", "critical"] },
    },
    select: { entityId: true, riskLevel: true },
  });
  for (const r of rows) {
    map.set(r.entityId, r.riskLevel === "critical" ? 14 : 8);
  }
  return map;
}
