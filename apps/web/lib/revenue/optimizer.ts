import { suggestPricingAdjustment, type PricingSignalInput, type PricingSuggestion } from "./pricing-engine";

export type ListingPricingOpportunity = {
  listingId: string;
  suggestion: PricingSuggestion;
};

/**
 * Batch helper for growth / host dashboards — still suggestions only.
 */
export function optimizeListingPrices(inputs: Array<PricingSignalInput & { listingId: string }>): ListingPricingOpportunity[] {
  const out: ListingPricingOpportunity[] = [];
  for (const row of inputs) {
    const { listingId, ...sig } = row;
    const suggestion = suggestPricingAdjustment(sig);
    if (suggestion.kind !== "hold") {
      out.push({ listingId, suggestion });
    }
  }
  return out;
}
