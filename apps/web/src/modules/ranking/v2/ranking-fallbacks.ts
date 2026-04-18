import type { RankingSignalBundle } from "@/src/modules/ranking/types";

/** When signals are sparse, use neutral 0.5 for missing proxies (keeps ordering stable). */
export function ensureSignalDefaults(s: RankingSignalBundle): RankingSignalBundle {
  const n = (v: number) => (Number.isFinite(v) ? v : 0.5);
  return {
    relevance: n(s.relevance),
    trust: n(s.trust),
    quality: n(s.quality),
    engagement: n(s.engagement),
    conversion: n(s.conversion),
    freshness: n(s.freshness),
    host: n(s.host),
    review: n(s.review),
    priceCompetitiveness: n(s.priceCompetitiveness),
    availability: n(s.availability),
  };
}
