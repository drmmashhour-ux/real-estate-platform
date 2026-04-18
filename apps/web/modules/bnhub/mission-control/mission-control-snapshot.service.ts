/**
 * Read-only snapshot: ranking, host-style signals, guest conversion metrics, booking/trust/pricing labels.
 * No writes; does not change Stripe, bookings, or listing rows.
 */

import { prisma } from "@/lib/db";
import type {
  BNHubListingRankingInput,
  BNHubListingScoreBreakdown,
} from "@/modules/bnhub/ranking/bnhub-ranking.types";
import { computeBNHubListingRanking } from "@/modules/bnhub/ranking/bnhub-ranking.service";
import { classifyHostListingPerformance } from "@/modules/bnhub/host-performance/host-performance-status.service";
import { buildGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.service";
import type { BNHubMissionControlRawSnapshot } from "./mission-control.types";

function deriveRankingWeakStrong(breakdown: Partial<BNHubListingScoreBreakdown>): {
  weakSignals: string[];
  strongSignals: string[];
} {
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

function pricingLabel(score?: number): string {
  if (score == null || !Number.isFinite(score)) return "unknown";
  if (score >= 14) return "competitive";
  if (score >= 10) return "neutral";
  return "elevated_vs_cohort";
}

function bookingHealthFromMetrics(guest: {
  listingMetrics?: {
    listingViews?: number;
    bookingStarts?: number;
    bookingCompletions?: number;
  };
}): string {
  const v = guest.listingMetrics?.listingViews ?? 0;
  const s = guest.listingMetrics?.bookingStarts ?? 0;
  const p = guest.listingMetrics?.bookingCompletions ?? 0;
  if (s >= 4 && p === 0) return "weak";
  if (p >= 1) return "strong";
  if (v >= 15 && s === 0) return "watch";
  if (v < 3 && s === 0) return "watch";
  return "healthy";
}

/**
 * Builds a raw mission-control snapshot for one listing (read-only Prisma + existing services).
 */
export async function buildBNHubMissionControlSnapshot(listingId: string): Promise<BNHubMissionControlRawSnapshot | null> {
  const createdAt = new Date().toISOString();
  const dataNotes: string[] = [];

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      nightPriceCents: true,
      maxGuests: true,
      description: true,
      amenities: true,
      photos: true,
      updatedAt: true,
      createdAt: true,
      city: true,
      bnhubListingReviewCount: true,
      _count: { select: { reviews: true, bookings: true, listingPhotos: true } },
    },
  });

  if (!listing) return null;

  const rows = await prisma.shortTermListing.findMany({
    where: { ownerId: listing.ownerId },
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

  let rankingFinal: number | undefined;
  let rankingBreakdown: BNHubListingScoreBreakdown | undefined;
  let rankingWhy: string[] | undefined;

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

  try {
    const rankings = computeBNHubListingRanking(inputs, {}, { skipMonitoring: true });
    const row = rankings.find((x) => x.listingId === listingId);
    if (row) {
      rankingFinal = row.finalScore;
      rankingBreakdown = row.breakdown;
      rankingWhy = row.why;
    } else {
      dataNotes.push("Ranking row missing for listing in cohort snapshot.");
    }
  } catch {
    dataNotes.push("Ranking computation failed for this snapshot.");
  }

  const hasFullRanking = Boolean(rankingBreakdown && rankingFinal != null);
  const ws = rankingBreakdown ? deriveRankingWeakStrong(rankingBreakdown) : { weakSignals: [], strongSignals: [] };

  const hostListingStatus = classifyHostListingPerformance({
    rankingScore: rankingFinal,
    breakdown: rankingBreakdown,
    weakSignals: ws.weakSignals,
    strongSignals: ws.strongSignals,
    hasFullRanking,
  });

  let guestSummary = await buildGuestConversionSummary(listingId).catch(() => null);
  if (!guestSummary) {
    guestSummary = {
      listingId,
      status: "watch",
      weakSignals: ["Guest conversion summary unavailable"],
      strongSignals: [],
      frictionSignals: [],
      recommendations: [],
      createdAt,
    };
    dataNotes.push("Guest conversion layer returned no data — using placeholder status.");
  }

  const bookingHealth = bookingHealthFromMetrics({ listingMetrics: guestSummary.listingMetrics });
  const pricingSignalLabel = pricingLabel(rankingBreakdown?.priceCompetitivenessScore);

  return {
    listingId: listing.id,
    listingTitle: listing.title,
    createdAt,
    rankingFinalScore: rankingFinal,
    rankingBreakdown,
    rankingWhy,
    hostListingStatus,
    hostWeakSignals: ws.weakSignals,
    hostStrongSignals: ws.strongSignals,
    guestConversionStatus: guestSummary.status,
    guestConversionWeakSignals: guestSummary.weakSignals,
    guestMetrics: {
      listingViews: guestSummary.listingMetrics?.listingViews,
      bookingStarts: guestSummary.listingMetrics?.bookingStarts,
      bookingCompletions: guestSummary.listingMetrics?.bookingCompletions,
      viewToStartRate: guestSummary.listingMetrics?.viewToStartRate,
      startToBookingRate: guestSummary.listingMetrics?.startToBookingRate,
    },
    bookingHealth,
    trustScoreBreakdown: rankingBreakdown?.trustScore,
    reviewCount: listing.bnhubListingReviewCount,
    pricingSignalLabel,
    dataNotes,
  };
}
