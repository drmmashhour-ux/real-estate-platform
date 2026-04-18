/**
 * Listing marketing intelligence — reads existing metrics tables (no fake numbers).
 */
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { getListingMarketingSignals } from "@/modules/marketing-intelligence/listing-marketing-signals.service";

export async function getListingGrowthSnapshot(fsboListingId: string, ownerUserId: string) {
  const listing = await prisma.fsboListing.findFirst({
    where: { id: fsboListingId, ownerId: ownerUserId },
    select: { id: true, title: true, city: true },
  });
  if (!listing) return null;

  const metrics = await prisma.fsboListingMetrics.findUnique({
    where: { fsboListingId },
  });

  const latestSnap = await prisma.hostListingPerformanceSnapshot.findFirst({
    where: { fsboListingId, userId: ownerUserId },
    orderBy: { createdAt: "desc" },
    select: { views: true, saves: true, bookings: true },
  });

  const score =
    metrics != null
      ? Math.round(
          (metrics.engagementScore +
            metrics.conversionScore +
            metrics.qualityScore +
            metrics.trustScore) /
            4
        )
      : null;

  const suggestions: string[] = [];
  if (metrics && metrics.qualityScore < 0.4) {
    suggestions.push("Add higher-resolution photos and complete property details to lift quality score.");
  }
  if (metrics && metrics.conversionScore < 0.35) {
    suggestions.push("Clarify price and availability in the description to improve conversion signals.");
  }
  if (!suggestions.length) {
    suggestions.push("Review weekly performance in host/seller dashboards; keep listing fresh.");
  }

  let marketingPerformance: Awaited<ReturnType<typeof getListingMarketingSignals>> | null = null;
  if (engineFlags.marketingIntelligenceV1) {
    const since = new Date(Date.now() - 90 * 86400000);
    marketingPerformance = await getListingMarketingSignals(ownerUserId, fsboListingId, since).catch(() => null);
  }

  let marketingConversionHint: string | null = null;
  let marketingConversionRate: number | null = null;
  if (marketingPerformance && latestSnap?.views != null && latestSnap.views > 0) {
    const r = marketingPerformance.leads / latestSnap.views;
    marketingConversionRate = Math.round(r * 10000) / 10000;
    marketingConversionHint = `Heuristic lead rate vs host snapshot views (90d): ${(r * 100).toFixed(2)}% — compare channels before treating as ground truth.`;
  }

  return {
    listingId: listing.id,
    title: listing.title,
    city: listing.city,
    recentViews: latestSnap?.views ?? null,
    recentSaves: latestSnap?.saves ?? null,
    recentBookings: latestSnap?.bookings ?? null,
    metrics,
    listingScore: score,
    improvementSuggestions: suggestions,
    marketingPerformance,
    marketingConversionRate,
    marketingConversionHint,
  };
}
