import { SOURCE_PRIORITY } from "@/lib/ai/drafting-policy";
import type { VectorSearchHit } from "@/lib/ai/vector-search";

export type RankedVectorHit = VectorSearchHit & { weightedScore: number };

/**
 * Boost official OACIQ `sourceKey`s over books after semantic score (OACIQ > explanatory).
 */
export function rankSearchHits(results: VectorSearchHit[]): RankedVectorHit[] {
  return results
    .map((r) => ({
      ...r,
      weightedScore: r.score + (SOURCE_PRIORITY[r.sourceKey] ?? 0) / 100,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

/** @deprecated use `rankSearchHits` */
export function rankSources(results: VectorSearchHit[]): RankedVectorHit[] {
  return rankSearchHits(results);
}
