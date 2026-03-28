import { computeRecommendedPrice } from "@/src/modules/bnhub-growth-engine/services/dynamicPricingService";

export type DemandBasedQuote = Awaited<ReturnType<typeof computeRecommendedPrice>>;

/**
 * Demand-based nightly pricing — delegates to BNHub dynamic pricing engine (signals + guardrails).
 */
export async function quoteDemandBasedNightlyPrice(listingId: string): Promise<DemandBasedQuote> {
  return computeRecommendedPrice(listingId);
}
