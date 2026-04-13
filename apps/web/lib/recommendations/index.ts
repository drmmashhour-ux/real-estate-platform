/**
 * BNHub + marketplace recommendations — similar, personalized, trending, recent, saved-based.
 */

import { getPersonalizedBnhubListings } from "./get-personalized-listings";

export type { SimilarListingCard } from "./cards";
export { toSimilarListingCards } from "./cards";

export {
  computeHybridRecommendationScore,
  DEFAULT_HYBRID_WEIGHTS,
  mergeHybridWeights,
  type HybridScoreParts,
} from "./compute-recommendation-score";

export * from "./diversity";

export { getSimilarBnhubListings } from "./get-similar-listings";
export type { GetSimilarBnhubParams } from "./get-similar-listings";

export { getPersonalizedBnhubListings } from "./get-personalized-listings";
export { getTrendingBnhubListings } from "./get-trending-listings";
export { getRecentlyViewedBnhubListings } from "./get-recently-viewed";
export { getSavedBasedBnhubListings } from "./get-saved-based-listings";
export { getStaysRecommendedInCity } from "./get-city-recommendations";

export {
  refreshUserSearchProfileFromActivity,
  getUserPreferenceSnapshot,
} from "./user-preferences";
export type { UserPreferenceSnapshot } from "./user-preferences";

export { logRecommendationEngagement } from "./recommendation-events";
export type { RecommendationWidgetSource } from "./recommendation-events";

export { bnhubListingRecommendationInsight } from "./listing-insights";
export type { ListingRecommendationInsight } from "./listing-insights";

/** @deprecated use `getPersonalizedBnhubListings` — kept for legacy imports */
export async function getStaysRecommendedForYou(userId: string | null, limit = 6) {
  return getPersonalizedBnhubListings(userId, limit);
}

export { citySlugToSearchQuery } from "./city-slug";
