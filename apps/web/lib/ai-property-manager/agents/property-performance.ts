/**
 * Property Performance Agent – evaluates property performance over time.
 */

import { prisma } from "@/lib/db";
import type { PropertyPerformanceOutput } from "../types";

export async function analyzePropertyPerformance(propertyIdentityId: string): Promise<PropertyPerformanceOutput> {
  const [listings, bookings, reviews, valuations] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { propertyIdentityId },
      select: { id: true, listingStatus: true, nightPriceCents: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { listing: { propertyIdentityId } },
      select: { id: true, status: true, totalCents: true, nights: true, checkIn: true, createdAt: true },
    }),
    prisma.review.findMany({
      where: { listing: { propertyIdentityId } },
      select: { propertyRating: true, createdAt: true },
    }),
    prisma.propertyValuation.findMany({
      where: { propertyIdentityId },
      take: 1,
      orderBy: { createdAt: "desc" },
      select: { estimatedValue: true, monthlyRentEstimate: true, nightlyRateEstimate: true },
    }),
  ]);

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const totalRevenue = completedBookings.reduce((s, b) => s + b.totalCents, 0);
  const totalNights = completedBookings.reduce((s, b) => s + b.nights, 0);
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.propertyRating, 0) / reviews.length : 0;
  const publishedCount = listings.filter((l) => l.listingStatus === "PUBLISHED").length;

  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const factors: string[] = [];

  if (completedBookings.length > 0) {
    score += Math.min(20, completedBookings.length * 2);
    strengths.push("Has completed bookings");
    factors.push("Booking history present");
  } else {
    weaknesses.push("No completed bookings yet");
    factors.push("No booking history");
  }
  if (avgRating >= 4) {
    score += 10;
    strengths.push(`Strong review average (${avgRating.toFixed(1)})`);
    factors.push("Good review score");
  } else if (reviews.length > 0) {
    weaknesses.push(`Review average below 4 (${avgRating.toFixed(1)})`);
    factors.push("Review score could improve");
  }
  if (publishedCount > 0) {
    score += 5;
    strengths.push("Listing is published");
  } else {
    weaknesses.push("No published listing");
    factors.push("Listing not published");
  }
  if (valuations.length > 0) {
    factors.push("Valuation data available");
  }

  const propertyPerformanceScore = Math.max(0, Math.min(100, score));
  const trendDirection = totalNights > 0 ? "stable" : "stable";

  return {
    propertyPerformanceScore,
    trendDirection,
    strengths,
    weaknesses,
    recommendedActions: weaknesses.length > 0
      ? weaknesses.map((w) => `Address: ${w}`)
      : ["Maintain current strategy", "Consider seasonal pricing updates"],
    confidenceScore: factors.length > 0 ? Math.min(90, 50 + factors.length * 10) : 40,
    reasonSummary: `Evaluated ${completedBookings.length} bookings, ${reviews.length} reviews, and listing status.`,
    contributingFactors: factors,
    humanReviewRequired: propertyPerformanceScore < 40 || weaknesses.length > 3,
    timestamp: new Date().toISOString(),
  };
}
