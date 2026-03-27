/**
 * AI Smart Pricing Engine – suggest optimal price from location, demand, seasonality.
 */
import { getAiPricingRecommendation } from "@/lib/ai-pricing";
import { getPricingFromInput } from "@/lib/ai-pricing-input";
import { logAiDecision } from "./logger";

export type PriceSuggestionResult = {
  recommendedPriceCents: number;
  recommendedPrice?: number; // alias for API
  minCents?: number;
  maxCents?: number;
  demandLevel?: string;
  factors: string[];
  confidence?: "low" | "medium" | "high";
};

export async function getPriceSuggestionForListing(
  listingId: string,
  options?: { checkIn?: string; checkOut?: string; store?: boolean; log?: boolean }
): Promise<PriceSuggestionResult> {
  const rec = await getAiPricingRecommendation(listingId, {
    checkIn: options?.checkIn,
    checkOut: options?.checkOut,
    store: options?.store !== false,
  });

  if (options?.log !== false) {
    await logAiDecision({
      action: "price_suggestion",
      entityType: "listing",
      entityId: listingId,
      recommendedPriceCents: rec.recommendedCents,
      details: {
        minCents: rec.minCents,
        maxCents: rec.maxCents,
        demandLevel: rec.demandLevel,
        factors: rec.factors,
      },
    });
  }

  return {
    recommendedPriceCents: rec.recommendedCents,
    recommendedPrice: rec.recommendedCents / 100,
    minCents: rec.minCents,
    maxCents: rec.maxCents,
    demandLevel: rec.demandLevel,
    factors: rec.factors,
    confidence: rec.demandLevel === "high" ? "high" : rec.demandLevel === "low" ? "low" : "medium",
  };
}

export type PriceSuggestionInput = {
  location: string;
  propertyType?: string;
  season?: string;
  demandLevel?: "low" | "medium" | "high";
  listingRating?: number;
  nearbyListingPrices?: number[];
};

export function getPriceSuggestionFromInput(input: PriceSuggestionInput): PriceSuggestionResult {
  const out = getPricingFromInput({
    location: input.location,
    propertyType: input.propertyType,
    season: input.season,
    demandLevel: input.demandLevel,
    listingRating: input.listingRating,
    nearbyListingPrices: input.nearbyListingPrices,
  });
  return {
    recommendedPriceCents: out.recommendedNightlyCents,
    recommendedPrice: out.recommendedNightlyCents / 100,
    minCents: out.suggestedMinCents,
    maxCents: out.suggestedMaxCents,
    factors: out.factors,
    confidence: out.confidenceLevel,
  };
}
