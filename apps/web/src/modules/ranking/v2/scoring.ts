import type { RankingSignalBundle } from "@/src/modules/ranking/types";
import { RANKING_V2_FEATURED_CAP, RANKING_V2_QUALITY_FLOOR, RANKING_V2_TRUST_FLOOR, RANKING_V2_WEIGHTS } from "./constants";
import type { RankingDomain, RankingV2SignalBreakdown01 } from "./ranking.types";
import { to100 } from "./normalize";

function liquidityFromSignals(s: RankingSignalBundle): number {
  return Math.min(1, 0.45 * s.availability + 0.35 * s.engagement + 0.2 * s.conversion);
}

function featuredRaw01(featuredActive: boolean, trust: number, quality: number): number {
  if (!featuredActive) return 0;
  if (trust < RANKING_V2_TRUST_FLOOR || quality < RANKING_V2_QUALITY_FLOOR) return 0;
  return 0.72;
}

export function buildV2Breakdown(
  s: RankingSignalBundle,
  featuredActive: boolean
): RankingV2SignalBreakdown01 {
  const liq = liquidityFromSignals(s);
  const feat01 = featuredRaw01(featuredActive, s.trust, s.quality);
  return {
    relevance: to100(s.relevance),
    recency: to100(s.freshness),
    trust: to100(s.trust),
    quality: to100(s.quality),
    priceCompetitiveness: to100(s.priceCompetitiveness),
    engagement: to100(s.engagement),
    conversion: to100(s.conversion),
    liquidity: to100(liq),
    featuredBoost: to100(feat01),
  };
}

export function blendRankingV2Score(domain: RankingDomain, breakdown: RankingV2SignalBreakdown01): number {
  const w = RANKING_V2_WEIGHTS[domain];
  const b = breakdown;
  let score =
    (b.relevance / 100) * w.relevance +
    (b.recency / 100) * w.recency +
    (b.trust / 100) * w.trust +
    (b.quality / 100) * w.quality +
    (b.priceCompetitiveness / 100) * w.priceCompetitiveness +
    (b.engagement / 100) * w.engagement +
    (b.conversion / 100) * w.conversion +
    (b.liquidity / 100) * w.liquidity +
    (b.featuredBoost / 100) * w.featuredBoost;

  let out = score * 100;
  const featuredWeighted = (b.featuredBoost / 100) * w.featuredBoost * 100;
  if (featuredWeighted > RANKING_V2_FEATURED_CAP) {
    out -= featuredWeighted - RANKING_V2_FEATURED_CAP;
  }
  return Math.min(100, Math.max(0, out));
}
