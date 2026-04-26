/**
 * Heuristic “ML-ish” search relevance: intent terms vs listing text + quality/trust signals.
 * Not a learned model; safe to tune weights without retraining.
 */
export type SearchableListing = {
  title?: string | null;
  description?: string | null;
  city?: string | null;
  propertyType?: string | null;
  /** Guest review average 1–5. */
  rating?: number | null;
  /** 0–100 composite (e.g. quality + discovery). */
  trustScore?: number | null;
};

export function computeSearchRelevance(query: string, listing: SearchableListing): number {
  const raw = query.trim();
  const q = raw.toLowerCase();
  const hasQuery = q.length > 0;

  let score = 0;

  if (hasQuery) {
    if (listing.title?.toLowerCase().includes(q)) score += 5;
    if (listing.description?.toLowerCase().includes(q)) score += 3;
    if (listing.city?.toLowerCase().includes(q)) score += 4;
    if (listing.propertyType?.toLowerCase().includes(q)) score += 2;
  }

  const rating = listing.rating;
  if (rating != null && Number.isFinite(rating) && rating >= 4.5) {
    score += 2;
  }

  const trust = listing.trustScore;
  if (trust != null && Number.isFinite(trust) && trust >= 80) {
    score += 2;
  }

  return score;
}

export type RankedSearchListing = SearchableListing & {
  relevanceScore: number;
  id: string;
};

export function rankBySearchRelevance(
  query: string,
  listings: Array<SearchableListing & { id: string }>
): RankedSearchListing[] {
  return listings
    .map((listing) => ({
      ...listing,
      relevanceScore: computeSearchRelevance(query, listing),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
