import { generateAndStoreListingRecommendation } from "@/modules/investment/recommendation-persist.service";
import { findBnhubListingIdsForRecommendationBatch } from "@/modules/investment/recommendation-metrics.service";

export async function generateRecommendationsForActiveListings() {
  const ids = await findBnhubListingIdsForRecommendationBatch();

  const results: Array<
    | { listingId: string; success: true; recommendationId: string }
    | { listingId: string; success: false; error: string }
  > = [];

  for (const listingId of ids) {
    try {
      const row = await generateAndStoreListingRecommendation(listingId);
      results.push({ listingId, success: true, recommendationId: row.id });
    } catch (error) {
      results.push({
        listingId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
