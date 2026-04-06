import { computeMarketplaceRankingScore } from "@/lib/listings/compute-marketplace-ranking-score";

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Anti-spike: damp extreme conversion ratios from low view counts.
 */
function dampedConversion(unlockSuccesses: number, viewsTotal: number): number {
  const v = Math.max(1, viewsTotal);
  const raw = unlockSuccesses / v;
  const damped = raw * (1 - Math.exp(-v / 40));
  return clamp01(Math.min(1, damped * 18));
}

/** Sort key multiplier for FSBO rows on buyer browse (recommended, non-AI path). */
export function buildFsboRecommendedBrowseSortUnit(input: {
  nowMs: number;
  featuredUntil: Date | null;
  createdAt: Date;
  demandScore: number;
  viewsTotal: number;
  unlockSuccesses: number;
  imageCount: number;
}): number {
  const featured01 = input.featuredUntil && input.featuredUntil.getTime() > input.nowMs ? 1 : 0;
  const demand01 = clamp01(input.demandScore / 100);
  const conversion01 = dampedConversion(input.unlockSuccesses, input.viewsTotal);
  const days = (input.nowMs - input.createdAt.getTime()) / 86400000;
  const recency01 = clamp01(Math.exp(-days / 45));
  const quality01 = clamp01(0.22 + 0.78 * Math.min(1, input.imageCount / 8));
  return computeMarketplaceRankingScore({
    demand01,
    conversion01,
    price01: 0.55,
    quality01,
    recency01,
    host01: 0.5,
    featured01,
  });
}
