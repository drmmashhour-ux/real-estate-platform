import {
  BnhubLuxuryEligibilityStatus,
  BnhubLuxuryTierCode,
  BnhubTrustRiskLevel,
  type ListingHealthStatus,
  type ListingQualityLevel,
  type ReputationLevel,
} from "@prisma/client";
import { prisma } from "@/lib/db";

const REP_SEARCH_WEIGHT = 2.6;

function reputationLevelToSignedWeight(level: ReputationLevel): number {
  switch (level) {
    case "excellent":
      return 1;
    case "good":
      return 0.55;
    case "fair":
      return 0.05;
    case "poor":
      return -0.9;
    default:
      return 0;
  }
}

/** Signed adjustment from `reputation_scores` (listing + host blend). Missing rows → 0. */
export async function getReputationSearchAdjustMapForListings(
  rows: { id: string; ownerId: string }[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (rows.length === 0) return map;
  const listingIds = [...new Set(rows.map((r) => r.id))];
  const ownerIds = [...new Set(rows.map((r) => r.ownerId))];
  const scores = await prisma.reputationScore.findMany({
    where: {
      OR: [
        { entityType: "listing", entityId: { in: listingIds } },
        { entityType: "host", entityId: { in: ownerIds } },
      ],
    },
    select: { entityType: true, entityId: true, level: true },
  });
  const byListing = new Map<string, ReputationLevel>();
  const byHost = new Map<string, ReputationLevel>();
  for (const s of scores) {
    if (s.entityType === "listing") byListing.set(s.entityId, s.level);
    if (s.entityType === "host") byHost.set(s.entityId, s.level);
  }
  for (const r of rows) {
    const ll = byListing.get(r.id);
    const lh = byHost.get(r.ownerId);
    if (!ll && !lh) {
      map.set(r.id, 0);
      continue;
    }
    const wl = ll != null ? reputationLevelToSignedWeight(ll) : 0;
    const wh = lh != null ? reputationLevelToSignedWeight(lh) : 0;
    const blended = (ll != null && lh != null ? wl * 0.55 + wh * 0.45 : ll != null ? wl : wh) * REP_SEARCH_WEIGHT;
    map.set(r.id, Math.round(blended * 100) / 100);
  }
  return map;
}

const PLATFORM_TRUST_BOOST_MAX = 3.2;

/** Modest boost from `platform_trust_scores` (listing + host blend). Missing rows → 0. */
export async function getPlatformTrustSearchBoostMapForListings(
  rows: { id: string; ownerId: string }[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (rows.length === 0) return map;
  const listingIds = [...new Set(rows.map((r) => r.id))];
  const ownerIds = [...new Set(rows.map((r) => r.ownerId))];
  const scores = await prisma.platformTrustScore.findMany({
    where: {
      OR: [
        { entityType: "listing", entityId: { in: listingIds } },
        { entityType: "host", entityId: { in: ownerIds } },
      ],
    },
    select: { entityType: true, entityId: true, score: true },
  });
  const byListing = new Map<string, number>();
  const byHost = new Map<string, number>();
  for (const s of scores) {
    if (s.entityType === "listing") byListing.set(s.entityId, s.score);
    if (s.entityType === "host") byHost.set(s.entityId, s.score);
  }
  for (const r of rows) {
    const ls = byListing.get(r.id);
    const hs = byHost.get(r.ownerId);
    if (ls == null && hs == null) {
      map.set(r.id, 0);
      continue;
    }
    const blended = (((ls ?? 42) * 0.55 + (hs ?? 42) * 0.45) / 100) * PLATFORM_TRUST_BOOST_MAX;
    map.set(r.id, Math.round(blended * 100) / 100);
  }
  return map;
}

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
    const boost = tierCodeToSearchBoost(r.tierCode);
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

const LISTING_QUALITY_SEARCH_WEIGHT = 2.1;

function listingQualitySearchAdjust(
  level: ListingQualityLevel,
  healthStatus: ListingHealthStatus
): number {
  let base = 0;
  switch (level) {
    case "excellent":
      base = 1;
      break;
    case "good":
      base = 0.52;
      break;
    case "needs_improvement":
      base = -0.06;
      break;
    case "poor":
      base = -0.78;
      break;
    default:
      base = 0;
  }
  if (healthStatus === "top_performer") base += 0.32;
  if (healthStatus === "needs_attention") base -= 0.18;
  return Math.round(base * LISTING_QUALITY_SEARCH_WEIGHT * 100) / 100;
}

/** Modest boost/penalty from cached `listing_quality_scores` (missing row → 0). */
export async function getListingQualitySearchAdjustMapForIds(
  listingIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;
  const rows = await prisma.listingQualityScore.findMany({
    where: { listingId: { in: listingIds } },
    select: { listingId: true, level: true, healthStatus: true },
  });
  for (const r of rows) {
    map.set(r.listingId, listingQualitySearchAdjust(r.level, r.healthStatus));
  }
  return map;
}
