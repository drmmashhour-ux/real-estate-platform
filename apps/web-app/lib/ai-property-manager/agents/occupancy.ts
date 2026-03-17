/**
 * Occupancy Optimization Agent – improves booking conversion and occupancy.
 */

import { prisma } from "@/lib/db";
import type { OccupancyOptimizationOutput } from "../types";

export async function analyzeOccupancy(listingId: string): Promise<OccupancyOptimizationOutput> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, propertyIdentityId: true, nightPriceCents: true, minStayNights: true },
  });
  if (!listing) {
    return {
      occupancyOptimizationScore: 0,
      gapFillSuggestions: [],
      dateSpecificRecommendations: [],
      suggestedOpenDates: [],
      suggestedSpecialOffers: [],
      confidenceScore: 0,
      reasonSummary: "Listing not found.",
      contributingFactors: [],
      humanReviewRequired: true,
      timestamp: new Date().toISOString(),
    };
  }

  const bookings = await prisma.booking.findMany({
    where: { listingId, status: "COMPLETED" },
    select: { checkIn: true, checkOut: true, nights: true },
  });
  const totalNights = bookings.reduce((s, b) => s + b.nights, 0);
  const daysInLast90 = 90;
  const occupancyRate = totalNights / Math.max(1, daysInLast90);
  const score = Math.round(Math.min(100, occupancyRate * 200));
  const factors: string[] = [];
  if (bookings.length > 0) factors.push(`${bookings.length} completed bookings in scope`);
  factors.push("Availability and calendar data can improve suggestions");

  return {
    occupancyOptimizationScore: score,
    gapFillSuggestions: score < 50 ? ["Open more weekend dates", "Consider lowering minimum stay for gaps"] : [],
    dateSpecificRecommendations: [],
    suggestedOpenDates: [],
    suggestedSpecialOffers: score < 60 ? ["Offer a limited-time discount for next 30 days"] : [],
    expectedOccupancyUplift: score < 50 ? 15 : undefined,
    confidenceScore: Math.min(75, 40 + factors.length * 15),
    reasonSummary: `Occupancy signal from ${bookings.length} bookings.`,
    contributingFactors: factors,
    humanReviewRequired: false,
    timestamp: new Date().toISOString(),
  };
}
