import { prisma } from "@/lib/db";
import type { PropertyInput, ShortTermRentValuationResult, ValuationExplanation } from "./types";
import { findComparableListings } from "./comparables";
import { computeConfidenceScore, getDataConfidenceNote } from "./confidence";

const DEFAULT_OCCUPANCY_PCT = 65;
const HIGH_SEASON_MULTIPLIER = 1.15;
const LOW_SEASON_MULTIPLIER = 0.85;

/**
 * Short-term rental (BNHUB) valuation: nightly rate, occupancy, revenue.
 */
export async function computeShortTermRentValuation(
  input: PropertyInput,
  listingId?: string | null
): Promise<ShortTermRentValuationResult> {
  const comparables = await findComparableListings(input, 10);
  const withRate = comparables.filter((c) => c.nightlyRateCents != null);

  let recommendedNightlyRateCents: number;
  let occupancyPct = DEFAULT_OCCUPANCY_PCT;

  if (withRate.length > 0) {
    const weights = withRate.map((c) => c.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    recommendedNightlyRateCents = Math.round(
      withRate.reduce((s, c, i) => s + (c.nightlyRateCents ?? 0) * weights[i], 0) / totalWeight
    );
    if (withRate.length >= 5) occupancyPct = 68;
  } else {
    recommendedNightlyRateCents = input.bedrooms
      ? Math.round((80 + input.bedrooms * 35) * 100)
      : 120_00;
  }

  if (listingId) {
    const bookingStats = await prisma.booking.aggregate({
      where: {
        listingId,
        status: "COMPLETED",
      },
      _count: true,
      _sum: { totalCents: true },
    });
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { nightPriceCents: true, createdAt: true },
    });
    if (listing && bookingStats._count > 0 && bookingStats._sum.totalCents) {
      const avgRevenuePerBooking = bookingStats._sum.totalCents / bookingStats._count;
      const monthsLive = Math.max(1, (Date.now() - listing.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const impliedOccupancy = (bookingStats._count * 2.5) / (30 * monthsLive);
      if (impliedOccupancy > 0 && impliedOccupancy <= 1) occupancyPct = Math.round(impliedOccupancy * 100);
    }
  }

  const nightsPerMonth = 30;
  const expectedMonthlyRevenueCents = Math.round(
    (recommendedNightlyRateCents * nightsPerMonth * occupancyPct) / 100
  );
  const expectedAnnualRevenueCents = expectedMonthlyRevenueCents * 12;

  const highSeasonNightlyCents = Math.round(recommendedNightlyRateCents * HIGH_SEASON_MULTIPLIER);
  const lowSeasonNightlyCents = Math.round(recommendedNightlyRateCents * LOW_SEASON_MULTIPLIER);

  const { score: confidenceScore, label: confidenceLabel } = computeConfidenceScore({
    comparableCount: comparables.length,
    dataCompleteness: input.bedrooms != null && input.bathrooms != null ? 0.8 : 0.5,
    signalConsistency: withRate.length >= 3 ? 0.8 : 0.5,
  });

  const seasonalitySummary = [
    { month: "Jan", occupancyPercent: Math.round(occupancyPct * 0.9) },
    { month: "Feb", occupancyPercent: Math.round(occupancyPct * 0.85) },
    { month: "Mar", occupancyPercent: Math.round(occupancyPct * 0.95) },
    { month: "Apr", occupancyPercent: Math.round(occupancyPct * 1.0) },
    { month: "May", occupancyPercent: Math.round(occupancyPct * 1.05) },
    { month: "Jun", occupancyPercent: Math.round(occupancyPct * 1.1) },
    { month: "Jul", occupancyPercent: Math.round(occupancyPct * 1.15) },
    { month: "Aug", occupancyPercent: Math.round(occupancyPct * 1.1) },
    { month: "Sep", occupancyPercent: Math.round(occupancyPct * 1.0) },
    { month: "Oct", occupancyPercent: Math.round(occupancyPct * 0.95) },
    { month: "Nov", occupancyPercent: Math.round(occupancyPct * 0.9) },
    { month: "Dec", occupancyPercent: Math.round(occupancyPct * 0.95) },
  ];

  const explanation: ValuationExplanation = {
    mainFactors: [
      "Local short-term rental demand",
      "Comparable nightly rates",
      "Seasonal demand patterns",
    ],
    positiveFactors: withRate.length >= 5 ? ["Strong comparable set"] : [],
    negativeFactors: withRate.length < 2 ? ["Limited comparable data"] : [],
    dataConfidenceNote: getDataConfidenceNote(confidenceLabel),
  };

  return {
    valuationType: "short_term_rental",
    recommendedNightlyRateCents,
    expectedMonthlyOccupancyPercent: occupancyPct,
    expectedMonthlyRevenueCents,
    expectedAnnualRevenueCents,
    highSeasonNightlyCents,
    lowSeasonNightlyCents,
    confidenceScore,
    confidenceLabel,
    seasonalitySummary,
    explanation,
  };
}
