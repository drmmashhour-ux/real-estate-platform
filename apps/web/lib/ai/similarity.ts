import { normalize } from "@/lib/ai/searchRelevance";

/**
 * Shared shape for “similar stay” heuristics (nightly $ in `price` major units).
 */
export type SimilarListingInput = {
  city: string;
  propertyType: string | null;
  /** Nightly price, major units (dollars). */
  price: number;
  rating: number | null;
  /** Optional demand (see {@link demandBoost}). */
  bookingsLast30d?: number | null;
  views?: number | null;
};

/**
 * Heuristic match score between a reference listing and a candidate (0+).
 * Does **not** include demand—use {@link demandBoost} in the final ranker.
 */
export function computeSimilarity(anchor: SimilarListingInput, candidate: SimilarListingInput): number {
  let score = 0;

  if (normalize(anchor.city) === normalize(candidate.city)) {
    score += 5;
  }
  if (anchor.propertyType && candidate.propertyType) {
    if (normalize(anchor.propertyType) === normalize(candidate.propertyType)) {
      score += 4;
    }
  }
  if (anchor.price > 0 && candidate.price > 0) {
    const diff = Math.abs(anchor.price - candidate.price);
    if (diff < 20) {
      score += 3;
    }
  }
  if (anchor.rating != null && candidate.rating != null && candidate.rating >= 4.5) {
    score += 2;
  }
  return score;
}

/**
 * Per-listing activity signal (Order 83): same shape as city heatmap weighting
 * `bookingsPerListing * 3 + viewsPerListing * 0.1` with listing-level numerators.
 */
export function demandBoost(listing: { bookingsLast30d?: number | null; views?: number | null }): number {
  const bpl = Math.max(0, listing.bookingsLast30d ?? 0);
  const vpl = Math.max(0, listing.views ?? 0);
  return bpl * 3 + vpl * 0.1;
}
