import { prisma } from "@/lib/db";
import { isFraudSoftRankingPenaltyEnabled } from "@/src/modules/fraud/fraudEnv";
import { fraudTrustV1Flags } from "@/config/feature-flags";

function fraudSoftPenaltyEnabled(): boolean {
  return isFraudSoftRankingPenaltyEnabled() || fraudTrustV1Flags.riskScoringV1;
}

/** Internal-only soft penalty points subtracted from ranking total when env enabled. */
export async function getBnhubListingFraudRankingAdjustment(listingId: string): Promise<{
  totalPenalty: number;
  metadataPatch: Record<string, unknown>;
}> {
  if (!fraudSoftPenaltyEnabled()) return { totalPenalty: 0, metadataPatch: {} };
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
  if (!fraudSoftPenaltyEnabled() || listingIds.length === 0) return map;
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
