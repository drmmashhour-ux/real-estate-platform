import { buildDealAnalyzerListingInput } from "@/modules/deal-analyzer/infrastructure/services/listingInputBuilder";

/** Loads listing inputs for deterministic deal scoring (same pipeline as Deal Analyzer). */
export async function loadDealAnalyzerInputForListing(listingId: string) {
  return buildDealAnalyzerListingInput(listingId);
}
