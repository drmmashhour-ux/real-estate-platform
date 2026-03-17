/**
 * Dynamic Pricing Agent – recommends pricing for sale, LTR, and BNHub.
 */

import { prisma } from "@/lib/db";
import type { PricingRecommendationOutput } from "../types";

export async function recommendPricing(params: {
  propertyIdentityId?: string;
  listingId?: string;
}): Promise<PricingRecommendationOutput> {
  const { propertyIdentityId, listingId } = params;
  let pid = propertyIdentityId;
  if (listingId && !pid) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { propertyIdentityId: true, nightPriceCents: true },
    });
    pid = listing?.propertyIdentityId ?? undefined;
  }
  const factors: string[] = [];
  let recommendedNightlyPrice: number | undefined;
  let recommendedSalePriceMin: number | undefined;
  let recommendedSalePriceMax: number | undefined;
  let recommendedRentMonthlyMin: number | undefined;
  let recommendedRentMonthlyMax: number | undefined;

  if (pid) {
    const [valuations, listings, region] = await Promise.all([
      prisma.propertyValuation.findMany({
        where: { propertyIdentityId: pid },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          valuationType: true,
          estimatedValue: true,
          monthlyRentEstimate: true,
          nightlyRateEstimate: true,
          confidenceScore: true,
        },
      }),
      prisma.shortTermListing.findMany({
        where: { propertyIdentityId: pid },
        select: { nightPriceCents: true },
      }),
      prisma.propertyIdentity.findUnique({
        where: { id: pid },
        select: { marketRegionId: true },
      }),
    ]);
    const saleVal = valuations.find((v) => v.valuationType === "sale");
    const rentVal = valuations.find((v) => v.valuationType === "long_term_rental");
    const strVal = valuations.find((v) => v.valuationType === "short_term_rental");
    if (saleVal?.estimatedValue) {
      recommendedSalePriceMin = Math.round(saleVal.estimatedValue * 0.95);
      recommendedSalePriceMax = Math.round(saleVal.estimatedValue * 1.05);
      factors.push("Sale valuation available");
    }
    if (rentVal?.monthlyRentEstimate) {
      recommendedRentMonthlyMin = Math.round(rentVal.monthlyRentEstimate * 0.95);
      recommendedRentMonthlyMax = Math.round(rentVal.monthlyRentEstimate * 1.05);
      factors.push("Long-term rent valuation available");
    }
    if (strVal?.nightlyRateEstimate || listings.length > 0) {
      recommendedNightlyPrice = strVal?.nightlyRateEstimate ?? listings[0]?.nightPriceCents ?? undefined;
      if (recommendedNightlyPrice) factors.push("STR rate from valuation or listing");
    }
    if (region?.marketRegionId) factors.push("Market region linked");
  }

  const confidenceScore = factors.length > 0 ? Math.min(85, 40 + factors.length * 15) : 35;
  return {
    recommendedSalePriceMin,
    recommendedSalePriceMax,
    recommendedRentMonthlyMin,
    recommendedRentMonthlyMax,
    recommendedNightlyPrice,
    minStaySuggestion: 2,
    discountStrategySuggestion: "Consider 5–10% weekly discount for 7+ night stays.",
    confidenceScore,
    reasonSummary: factors.length > 0
      ? `Recommendations based on ${factors.length} data sources.`
      : "Insufficient data; add valuation or listing price for better recommendations.",
    contributingFactors: factors,
    humanReviewRequired: confidenceScore < 50,
    timestamp: new Date().toISOString(),
  };
}
