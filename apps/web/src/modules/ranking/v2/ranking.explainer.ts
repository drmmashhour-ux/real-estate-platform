import type { RankingV2Explain, RankingV2SignalBreakdown01 } from "./ranking.types";
import { RANKING_V2_QUALITY_FLOOR, RANKING_V2_TRUST_FLOOR } from "./constants";

export function explainRankingV2(
  score: number,
  breakdown: RankingV2SignalBreakdown01,
  opts: { featuredActive: boolean }
): RankingV2Explain {
  const warnings: string[] = [];
  if (breakdown.trust / 100 < RANKING_V2_TRUST_FLOOR) warnings.push("trust_below_floor");
  if (breakdown.quality / 100 < RANKING_V2_QUALITY_FLOOR) warnings.push("quality_below_floor");
  if (opts.featuredActive && warnings.length > 0) warnings.push("featured_suppressed");

  const pairs: [string, number][] = [
    ["Strong search match", breakdown.relevance],
    ["Recently updated", breakdown.recency],
    ["Trust signals", breakdown.trust],
    ["Listing completeness", breakdown.quality],
    ["Price vs market", breakdown.priceCompetitiveness],
    ["Engagement history", breakdown.engagement],
    ["Conversion signals", breakdown.conversion],
    ["Availability / liquidity", breakdown.liquidity],
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  const topReasons = pairs.slice(0, 3).map(([label, v]) => `${label}: ${Math.round(v)}`);

  return {
    rankingScore: Math.round(score * 10) / 10,
    topReasons,
    signalBreakdown: breakdown,
    warnings,
  };
}
