import { prisma } from "@/lib/db";
import type { RankingListingType } from "@/src/modules/ranking/dataMap";

const DAY_MS = 86400000;

export type CtrByPositionRow = { position: number; impressions: number; clicks: number; ctr: number };

export async function computeCtrByPosition(
  listingType: RankingListingType,
  days = 14
): Promise<CtrByPositionRow[]> {
  const since = new Date(Date.now() - days * DAY_MS);
  const [impr, clk] = await Promise.all([
    prisma.rankingImpressionLog.groupBy({
      by: ["position"],
      where: { listingType, createdAt: { gte: since }, position: { not: null } },
      _count: { _all: true },
    }),
    prisma.rankingClickLog.groupBy({
      by: ["position"],
      where: { listingType, createdAt: { gte: since }, position: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const imap = new Map(impr.map((r) => [r.position ?? -1, r._count._all]));
  const cmap = new Map(clk.map((r) => [r.position ?? -1, r._count._all]));
  const positions = new Set([...imap.keys(), ...cmap.keys()].filter((p) => p >= 0));
  const rows: CtrByPositionRow[] = [];
  for (const p of positions) {
    const impressions = imap.get(p) ?? 0;
    const clicks = cmap.get(p) ?? 0;
    rows.push({
      position: p,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
    });
  }
  return rows.sort((a, b) => a.position - b.position);
}

export type ExposureConversionRow = {
  listingId: string;
  impressions: number;
  clicks: number;
  ctr: number;
};

/** Listings with material impressions but CTR below median — evidence only, no auto-boost. */
export async function detectHighExposureLowCtr(
  listingType: RankingListingType,
  days = 14,
  minImpressions = 80
): Promise<ExposureConversionRow[]> {
  const since = new Date(Date.now() - days * DAY_MS);
  const impr = await prisma.rankingImpressionLog.groupBy({
    by: ["listingId"],
    where: { listingType, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const clk = await prisma.rankingClickLog.groupBy({
    by: ["listingId"],
    where: { listingType, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const cmap = new Map(clk.map((c) => [c.listingId, c._count._all]));
  const rows: ExposureConversionRow[] = impr
    .filter((i) => i._count._all >= minImpressions)
    .map((i) => {
      const impressions = i._count._all;
      const clicks = cmap.get(i.listingId) ?? 0;
      return {
        listingId: i.listingId,
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
      };
    });
  if (rows.length === 0) return [];
  const ctrs = rows.map((r) => r.ctr).sort((a, b) => a - b);
  const med = ctrs[Math.floor(ctrs.length / 2)] ?? 0;
  return rows.filter((r) => r.ctr < med * 0.5 && r.ctr < 0.02).sort((a, b) => b.impressions - a.impressions);
}

export type RankingCompletenessRow = {
  listingId: string;
  listingType: string;
  trustScore: number;
  qualityScore: number;
};

export async function detectLowTrustOrQualityScores(
  listingType: RankingListingType,
  take = 40
): Promise<RankingCompletenessRow[]> {
  const rows = await prisma.listingRankingScore.findMany({
    where: { listingType },
    orderBy: { totalScore: "asc" },
    take,
    select: { listingId: true, listingType: true, trustScore: true, qualityScore: true },
  });
  return rows.filter((r) => r.trustScore < 0.42 || r.qualityScore < 0.4);
}

/**
 * Refresh derived analytics used by admin / executive — does not mutate listing scores.
 */
export async function updateRankingSignalsFromBehavior(): Promise<{
  ctrRows: CtrByPositionRow[];
  lowCtr: ExposureConversionRow[];
  lowTrust: RankingCompletenessRow[];
}> {
  const [ctrBnhub, ctrRe, lowBnhub, lowRe, trustB, trustR] = await Promise.all([
    computeCtrByPosition("bnhub"),
    computeCtrByPosition("real_estate"),
    detectHighExposureLowCtr("bnhub"),
    detectHighExposureLowCtr("real_estate"),
    detectLowTrustOrQualityScores("bnhub"),
    detectLowTrustOrQualityScores("real_estate"),
  ]);
  return {
    ctrRows: [...ctrBnhub, ...ctrRe],
    lowCtr: [...lowBnhub, ...lowRe],
    lowTrust: [...trustB, ...trustR],
  };
}

export function detectHighExposureLowConversionListings(
  lowCtr: ExposureConversionRow[]
): ExposureConversionRow[] {
  return lowCtr;
}
