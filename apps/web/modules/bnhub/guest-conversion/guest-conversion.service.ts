/**
 * Orchestrates read-only guest conversion summary for a BNHub listing.
 */

import { prisma } from "@/lib/db";
import { bnhubGuestConversionFlags } from "@/config/feature-flags";
import { buildListingConversionMetrics } from "./listing-conversion.service";
import { buildSearchConversionMetrics } from "./search-conversion.service";
import { detectBookingFrictionSignals } from "./booking-friction.service";
import { buildGuestConversionRecommendations } from "./guest-conversion-recommendations.service";
import { classifyGuestConversionStatus } from "./guest-conversion-status.service";
import type { BNHubGuestConversionSummary, GuestConversionFrictionContext } from "./guest-conversion.types";
import { recordGuestConversionSummaryBuilt } from "./guest-conversion-monitoring.service";

function photoCountFromListing(photos: unknown, listingPhotoCount: number): number {
  if (listingPhotoCount > 0) return listingPhotoCount;
  if (Array.isArray(photos)) return photos.length;
  return 0;
}

/**
 * Builds one advisory summary for `listingId` (ShortTermListing / supabase listing id).
 * No writes. Recommendations/friction omitted when respective feature flags are off.
 */
export async function buildGuestConversionSummary(listingId: string): Promise<BNHubGuestConversionSummary> {
  const createdAt = new Date().toISOString();
  const weakSignals: string[] = [];
  const strongSignals: string[] = [];

  const listing = await prisma.shortTermListing
    .findUnique({
      where: { id: listingId },
      select: {
        id: true,
        nightPriceCents: true,
        description: true,
        photos: true,
        bnhubListingReviewCount: true,
        _count: { select: { listingPhotos: true } },
      },
    })
    .catch(() => null);

  if (!listing) {
    weakSignals.push("Listing was not found — conversion signals cannot be computed.");
    const empty: BNHubGuestConversionSummary = {
      listingId,
      status: "weak",
      weakSignals,
      strongSignals,
      frictionSignals: [],
      recommendations: [],
      createdAt,
    };
    try {
      recordGuestConversionSummaryBuilt({
        listingId,
        status: "weak",
        frictionCount: 0,
        recommendationCount: 0,
        warnings: 1,
      });
    } catch {
      /* */
    }
    return empty;
  }

  const [searchResult, listingResult] = await Promise.all([
    buildSearchConversionMetrics(listingId),
    buildListingConversionMetrics(listingId),
  ]);

  weakSignals.push(...searchResult.dataNotes, ...listingResult.dataNotes);

  const photoCount = photoCountFromListing(listing.photos, listing._count.listingPhotos);
  const hasDescription = Boolean(listing.description && listing.description.trim().length > 40);

  if (listing.bnhubListingReviewCount >= 5) {
    strongSignals.push("Multiple guest reviews are visible — trust baseline is forming.");
  }
  if ((listingResult.metrics.bookingCompletions ?? 0) >= 1) {
    strongSignals.push("At least one paid funnel completion observed in the window.");
  }

  const ctx: GuestConversionFrictionContext = {
    listingId,
    windowDays: 30,
    searchMetrics: searchResult.metrics,
    listingMetrics: listingResult.metrics,
    reviewCount: listing.bnhubListingReviewCount,
    photoCount,
    hasDescription,
    nightPriceCents: listing.nightPriceCents,
  };

  let frictionSignals = detectBookingFrictionSignals(ctx);
  if (!bnhubGuestConversionFlags.bookingFrictionV1) {
    frictionSignals = [];
  }

  let recommendations = buildGuestConversionRecommendations({ context: ctx, frictionSignals });
  if (!bnhubGuestConversionFlags.recommendationsV1) {
    recommendations = [];
  }

  const status = classifyGuestConversionStatus({
    searchMetrics: searchResult.metrics,
    listingMetrics: listingResult.metrics,
    frictionSignals,
  });

  const warningCount = weakSignals.length;

  try {
    recordGuestConversionSummaryBuilt({
      listingId,
      status,
      frictionCount: frictionSignals.length,
      recommendationCount: recommendations.length,
      warnings: warningCount,
    });
  } catch {
    /* */
  }

  return {
    listingId,
    searchMetrics: searchResult.metrics,
    listingMetrics: listingResult.metrics,
    status,
    weakSignals: [...new Set(weakSignals)].slice(0, 12),
    strongSignals: [...new Set(strongSignals)].slice(0, 8),
    frictionSignals,
    recommendations,
    createdAt,
  };
}
