/**
 * Aggregates for /admin/ranking — explainability + ops (weak, overexposed, exploration).
 */

import { prisma } from "@/lib/db";
import { RANKING_LISTING_TYPE_BNHUB, RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";

export type RankingAdminSnapshot = {
  topBnhub: Array<{ listingId: string; totalScore: number; city: string | null }>;
  topRealEstate: Array<{ listingId: string; totalScore: number; city: string | null }>;
  weakBnhub: Array<{ listingId: string; totalScore: number; city: string | null }>;
  weakRealEstate: Array<{ listingId: string; totalScore: number; city: string | null }>;
  /** High views + suspiciously low CTR */
  overexposedBnhub: Array<{
    listingId: string;
    views30d: number;
    ctr: number | null;
  }>;
  /** Good persisted score but low measured views — candidates for exploration boost */
  explorationCandidatesBnhub: Array<{
    listingId: string;
    totalScore: number;
    views30d: number;
  }>;
};

export async function buildRankingAdminSnapshot(): Promise<RankingAdminSnapshot> {
  const [topBnhub, topRe, weakB, weakRe, metricsHeavy] = await Promise.all([
    prisma.listingRankingScore.findMany({
      where: { listingType: RANKING_LISTING_TYPE_BNHUB },
      orderBy: { totalScore: "desc" },
      take: 20,
      select: { listingId: true, totalScore: true, city: true },
    }),
    prisma.listingRankingScore.findMany({
      where: { listingType: RANKING_LISTING_TYPE_REAL_ESTATE },
      orderBy: { totalScore: "desc" },
      take: 20,
      select: { listingId: true, totalScore: true, city: true },
    }),
    prisma.listingRankingScore.findMany({
      where: { listingType: RANKING_LISTING_TYPE_BNHUB },
      orderBy: { totalScore: "asc" },
      take: 20,
      select: { listingId: true, totalScore: true, city: true },
    }),
    prisma.listingRankingScore.findMany({
      where: { listingType: RANKING_LISTING_TYPE_REAL_ESTATE },
      orderBy: { totalScore: "asc" },
      take: 20,
      select: { listingId: true, totalScore: true, city: true },
    }),
    prisma.listingSearchMetrics.findMany({
      where: { views30d: { gte: 120 } },
      orderBy: { views30d: "desc" },
      take: 40,
      select: { listingId: true, views30d: true, ctr: true },
    }),
  ]);

  const overexposedBnhub = metricsHeavy
    .filter((m) => m.ctr != null && m.ctr < 0.04)
    .slice(0, 15)
    .map((m) => ({ listingId: m.listingId, views30d: m.views30d, ctr: m.ctr }));

  const ranked = await prisma.listingRankingScore.findMany({
    where: {
      listingType: RANKING_LISTING_TYPE_BNHUB,
      totalScore: { gte: 55 },
    },
    orderBy: { totalScore: "desc" },
    take: 80,
    select: { listingId: true, totalScore: true },
  });
  const ids = ranked.map((r) => r.listingId);
  const viewsRows =
    ids.length === 0
      ? []
      : await prisma.listingSearchMetrics.findMany({
          where: { listingId: { in: ids } },
          select: { listingId: true, views30d: true },
        });
  const viewsMap = new Map(viewsRows.map((v) => [v.listingId, v.views30d]));
  const explorationCandidatesBnhub = ranked
    .map((r) => ({
      listingId: r.listingId,
      totalScore: r.totalScore,
      views30d: viewsMap.get(r.listingId) ?? 0,
    }))
    .filter((x) => x.views30d < 12)
    .slice(0, 15);

  return {
    topBnhub,
    topRealEstate: topRe,
    weakBnhub: weakB,
    weakRealEstate: weakRe,
    overexposedBnhub,
    explorationCandidatesBnhub,
  };
}
