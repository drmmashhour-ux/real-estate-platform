import { BnhubLuxuryEligibilityStatus, BnhubLuxuryTierCode, BnhubTrustRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Capped luxury tier visibility boost in “recommended” sort (internal, auditable). */
export const BNHUB_TIER_SEARCH_BOOST_CAP = 6;

export function tierCodeToSearchBoost(tier: BnhubLuxuryTierCode | null | undefined): number {
  switch (tier) {
    case BnhubLuxuryTierCode.ELITE:
      return Math.min(BNHUB_TIER_SEARCH_BOOST_CAP, 6);
    case BnhubLuxuryTierCode.PREMIUM:
      return 4;
    case BnhubLuxuryTierCode.VERIFIED:
      return 2;
    default:
      return 0;
  }
}

export async function getLuxuryTierSearchBoostMapForIds(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;
  const rows = await prisma.bnhubLuxuryTier.findMany({
    where: {
      listingId: { in: listingIds },
      eligibilityStatus: { not: BnhubLuxuryEligibilityStatus.SUSPENDED },
    },
    select: { listingId: true, tierCode: true, eligibilityStatus: true },
  });
  for (const r of rows) {
    if (r.eligibilityStatus !== BnhubLuxuryEligibilityStatus.ELIGIBLE) {
      map.set(r.listingId, 0);
      continue;
    }
    let boost = tierCodeToSearchBoost(r.tierCode);
    map.set(r.listingId, boost);
  }
  return map;
}

/** Down-rank listings with elevated trust risk (capped). */
export async function getTrustRiskPenaltyMapForIds(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;
  const rows = await prisma.bnhubTrustProfile.findMany({
    where: { listingId: { in: listingIds } },
    select: { listingId: true, overallRiskLevel: true },
  });
  for (const r of rows) {
    if (r.overallRiskLevel === BnhubTrustRiskLevel.CRITICAL) map.set(r.listingId, 18);
    else if (r.overallRiskLevel === BnhubTrustRiskLevel.HIGH) map.set(r.listingId, 10);
    else if (r.overallRiskLevel === BnhubTrustRiskLevel.MEDIUM) map.set(r.listingId, 4);
  }
  return map;
}
