/**
 * Read-only host listing performance summary — uses BNHub ranking scores when available; no writes.
 */

import { prisma } from "@/lib/db";
import type {
  BNHubListingRankingInput,
  BNHubListingScoreBreakdown,
} from "@/modules/bnhub/ranking/bnhub-ranking.types";
import {
  computeBNHubListingRanking,
} from "@/modules/bnhub/ranking/bnhub-ranking.service";
import type {
  BNHubHostListingPerformance,
  BNHubHostPerformanceSummary,
} from "./host-performance.types";
import { classifyHostListingPerformance } from "./host-performance-status.service";
import { buildHostListingRecommendations } from "./host-recommendations.service";
import { recordHostPerformanceSummaryBuilt } from "./host-performance-monitoring.service";

function deriveWeakStrongSignals(
  breakdown: Partial<BNHubListingScoreBreakdown>,
): { weakSignals: string[]; strongSignals: string[] } {
  const weakSignals: string[] = [];
  const strongSignals: string[] = [];

  if ((breakdown.conversionScore ?? 0) < 12) {
    weakSignals.push("Booking and engagement signals are still building");
  } else if ((breakdown.conversionScore ?? 0) >= 20) {
    strongSignals.push("Solid booking and engagement signals");
  }

  if ((breakdown.qualityScore ?? 0) < 8) {
    weakSignals.push("Content quality (photos, amenities, description) has room to grow");
  } else if ((breakdown.qualityScore ?? 0) >= 14) {
    strongSignals.push("Strong listing content quality");
  }

  if ((breakdown.trustScore ?? 0) < 10) {
    weakSignals.push("Trust signals (reviews, volume) are limited so far");
  } else if ((breakdown.trustScore ?? 0) >= 14) {
    strongSignals.push("Strong guest trust signals");
  }

  if ((breakdown.freshnessScore ?? 0) < 6) {
    weakSignals.push("Listing has not been refreshed recently");
  } else if ((breakdown.freshnessScore ?? 0) >= 8) {
    strongSignals.push("Recently updated listing");
  }

  if ((breakdown.priceCompetitivenessScore ?? 0) < 11) {
    weakSignals.push("Nightly price may be less competitive vs similar listings (advisory)");
  } else if ((breakdown.priceCompetitivenessScore ?? 0) >= 14) {
    strongSignals.push("Competitive nightly pricing vs similar listings");
  }

  return {
    weakSignals: [...new Set(weakSignals)].slice(0, 6),
    strongSignals: [...new Set(strongSignals)].slice(0, 6),
  };
}

/**
 * Builds a performance summary for all short-term listings owned by `hostId`. Does not mutate data.
 */
export async function buildHostPerformanceSummary(hostId: string): Promise<BNHubHostPerformanceSummary> {
  const rows = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: {
      id: true,
      title: true,
      nightPriceCents: true,
      maxGuests: true,
      description: true,
      amenities: true,
      photos: true,
      updatedAt: true,
      createdAt: true,
      city: true,
      _count: { select: { reviews: true, bookings: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const ids = rows.map((r) => r.id);
  let reviewAvgs: { listingId: string; avg: number | null }[] = [];
  if (ids.length > 0) {
    const grouped = await prisma.review.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids } },
      _avg: { propertyRating: true },
    });
    reviewAvgs = grouped.map((g) => ({
      listingId: g.listingId,
      avg: g._avg.propertyRating,
    }));
  }
  const avgByListing = new Map(reviewAvgs.map((x) => [x.listingId, x.avg]));

  const inputs: BNHubListingRankingInput[] = rows.map((r) => ({
    listingId: r.id,
    nightPriceCents: r.nightPriceCents,
    maxGuests: r.maxGuests,
    description: r.description ?? null,
    amenities: r.amenities,
    photos: r.photos,
    updatedAt: r.updatedAt,
    createdAt: r.createdAt,
    city: r.city,
    _count: r._count,
    reviews:
      avgByListing.get(r.id) != null && Number.isFinite(avgByListing.get(r.id) as number)
        ? [{ propertyRating: avgByListing.get(r.id) as number }]
        : [],
  }));

  let rankingById = new Map<string, ReturnType<typeof computeBNHubListingRanking>[number]>();
  let missingDataWarnings = 0;

  if (inputs.length > 0) {
    try {
      const rankings = computeBNHubListingRanking(inputs, {}, { skipMonitoring: true });
      rankingById = new Map(rankings.map((x) => [x.listingId, x]));
    } catch {
      missingDataWarnings += 1;
    }
  }
  if (rows.length > 0 && rankingById.size === 0) {
    missingDataWarnings += 1;
  }

  const listings: BNHubHostListingPerformance[] = [];
  let recTotal = 0;

  for (const r of rows) {
    const rank = rankingById.get(r.id);
    const breakdown = rank?.breakdown;
    const hasFullRanking = Boolean(rank && breakdown);

    const weakStrong =
      breakdown != null
        ? deriveWeakStrongSignals(breakdown)
        : {
            weakSignals: ["Full ranking score was not available for this snapshot"],
            strongSignals: [] as string[],
          };

    const weakSignals = weakStrong.weakSignals;
    const strongSignals = weakStrong.strongSignals;

    const performanceStatus = classifyHostListingPerformance({
      rankingScore: rank?.finalScore,
      breakdown,
      weakSignals,
      strongSignals,
      hasFullRanking,
    });

    const recommendations = buildHostListingRecommendations(
      {
        listingId: r.id,
        description: r.description,
        amenities: r.amenities,
        photos: r.photos,
        updatedAt: r.updatedAt,
        breakdown,
      },
      breakdown,
    );
    recTotal += recommendations.length;

    listings.push({
      listingId: r.id,
      listingTitle: r.title,
      rankingScore: rank?.finalScore,
      performanceStatus,
      scoreBreakdown: breakdown,
      weakSignals,
      strongSignals,
      rankingExplain: rank?.why,
      recommendations,
    });
  }

  const weakListings = listings.filter((l) => l.performanceStatus === "weak").length;
  const watchListings = listings.filter((l) => l.performanceStatus === "watch").length;
  const healthyListings = listings.filter((l) => l.performanceStatus === "healthy").length;
  const strongListings = listings.filter((l) => l.performanceStatus === "strong").length;

  recordHostPerformanceSummaryBuilt({
    listings: listings.length,
    weak: weakListings,
    healthy: healthyListings,
    strong: strongListings,
    watch: watchListings,
    recommendations: recTotal,
    missingDataWarnings,
  });

  return {
    hostId,
    listings,
    totalListings: listings.length,
    weakListings,
    healthyListings,
    strongListings,
    watchListings,
    createdAt: new Date().toISOString(),
  };
}
