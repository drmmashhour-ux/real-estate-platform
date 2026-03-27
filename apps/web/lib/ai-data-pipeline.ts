/**
 * AI Data Pipeline – collect platform data for AI models.
 * Aggregates: listings, bookings, reviews, pricing history, search activity.
 * Run from a cron job or admin trigger; stores or returns aggregated metrics.
 */
import { prisma } from "@/lib/db";

export type AiPipelineMetrics = {
  runAt: string;
  listings: { total: number; byCity: Record<string, number>; avgPriceCentsByCity: Record<string, number> };
  bookings: { total: number; last30Days: number; cancellationCount: number };
  reviews: { total: number; avgRating: number };
  pricingHistory: number;
  demandForecasts: number;
  fraudScores: number;
};

export async function collectAiPipelineMetrics(): Promise<AiPipelineMetrics> {
  const runAt = new Date().toISOString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [listings, listingAgg, bookings30, allBookings, cancelCount, reviews, reviewAvg, pricingCount, demandCount, fraudCount] =
    await Promise.all([
      prisma.shortTermListing.findMany({
        select: { id: true, city: true, nightPriceCents: true },
      }),
      prisma.shortTermListing.groupBy({
        by: ["city"],
        _count: { id: true },
        _avg: { nightPriceCents: true },
      }),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: { in: ["CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST"] },
        },
      }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { propertyRating: true } }),
      prisma.aiPricingRecommendation.count(),
      prisma.demandForecast.count(),
      prisma.fraudScore.count(),
    ]);

  const byCity: Record<string, number> = {};
  const avgPriceCentsByCity: Record<string, number> = {};
  for (const g of listingAgg) {
    byCity[g.city] = g._count.id;
    avgPriceCentsByCity[g.city] = g._avg.nightPriceCents ?? 0;
  }

  return {
    runAt,
    listings: {
      total: listings.length,
      byCity,
      avgPriceCentsByCity,
    },
    bookings: {
      total: allBookings,
      last30Days: bookings30,
      cancellationCount: cancelCount,
    },
    reviews: {
      total: reviews,
      avgRating: reviewAvg._avg.propertyRating ?? 0,
    },
    pricingHistory: pricingCount,
    demandForecasts: demandCount,
    fraudScores: fraudCount,
  };
}
