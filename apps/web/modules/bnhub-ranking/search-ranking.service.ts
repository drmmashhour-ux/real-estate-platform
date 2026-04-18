import { computeBnhubRankingBundle } from "./ranking-engine.service";

/** Stable sort: higher `rankingScore` first; tie-breaker by id. */
export async function sortListingIdsByBnhubRanking(listingIds: string[]): Promise<string[]> {
  const bundles = await Promise.all(listingIds.map((id) => computeBnhubRankingBundle(id)));
  const pairs = listingIds.map((id, i) => ({
    id,
    score: bundles[i]?.rankingScore ?? 0,
  }));
  pairs.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return pairs.map((p) => p.id);
}
