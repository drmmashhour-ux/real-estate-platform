/**
 * Host-facing listing quality + pricing tips derived from marketplace signals (no auto price changes).
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import { computeListingPerformanceScore } from "@/lib/market-intelligence/platform-signals";

export type ListingOptimizationSuggestion = {
  id: string;
  category: "title" | "photos" | "price" | "performance";
  priority: "high" | "medium" | "low";
  message: string;
};

export type ListingOptimizationPayload = {
  listingId: string;
  performanceScore: number;
  metrics: {
    views30d: number;
    bookings30d: number;
    ctr: number | null;
    conversionRate: number | null;
  } | null;
  pricing: {
    currentNightCents: number;
    recommendedNightCents: number;
    peerAvgNightCents: number | null;
    peerListingCount: number;
  };
  suggestions: ListingOptimizationSuggestion[];
};

function photoTotal(photosJson: unknown, structuredCount: number): number {
  const legacy = Array.isArray(photosJson) ? photosJson.length : 0;
  return Math.max(structuredCount, legacy);
}

export async function getListingOptimizationForHost(
  listingId: string,
  hostUserId: string
): Promise<ListingOptimizationPayload | null> {
  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: hostUserId },
    select: {
      id: true,
      title: true,
      city: true,
      propertyType: true,
      nightPriceCents: true,
      listingStatus: true,
      photos: true,
      _count: { select: { listingPhotos: true } },
    },
  });
  if (!listing) return null;

  const [metrics, smart, cityPeers] = await Promise.all([
    prisma.listingSearchMetrics.findUnique({ where: { listingId } }),
    generateSmartPrice(listingId),
    prisma.shortTermListing.aggregate({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: { equals: listing.city, mode: "insensitive" },
        id: { not: listingId },
        ...(listing.propertyType?.trim()
          ? {
              propertyType: { equals: listing.propertyType.trim(), mode: "insensitive" as const },
            }
          : {}),
      },
      _avg: { nightPriceCents: true },
      _count: { _all: true },
    }),
  ]);

  const cityAvg =
    cityPeers._avg.nightPriceCents != null && cityPeers._avg.nightPriceCents > 0
      ? cityPeers._avg.nightPriceCents
      : smart.marketAvgCents;

  const m = metrics
    ? {
        views30d: metrics.views30d,
        bookings30d: metrics.bookings30d,
        ctr: metrics.ctr,
        conversionRate: metrics.conversionRate,
      }
    : null;

  const performanceScore = computeListingPerformanceScore(
    m,
    listing.nightPriceCents,
    cityAvg ?? smart.marketAvgCents
  );

  const suggestions: ListingOptimizationSuggestion[] = [];
  const title = listing.title.trim();
  if (title.length < 18) {
    suggestions.push({
      id: "title-short",
      category: "title",
      priority: "high",
      message: "Add a descriptive title (neighborhood + property type + one standout) — short titles get fewer clicks in search.",
    });
  } else if (title.length < 28 && !/\b(bed|chambre|room|loft|condo|house|waterfront|downtown)\b/i.test(title)) {
    suggestions.push({
      id: "title-detail",
      category: "title",
      priority: "medium",
      message: "Consider mentioning beds, area, or a key amenity in the title to improve relevance in guest searches.",
    });
  }

  const nPhotos = photoTotal(listing.photos, listing._count.listingPhotos);
  if (nPhotos < 5) {
    suggestions.push({
      id: "photos-count",
      category: "photos",
      priority: "high",
      message: `Add at least ${5 - nPhotos} more quality photos (rooms, kitchen, bathroom, outdoor) — listings with 8+ photos tend to convert better.`,
    });
  } else if (nPhotos < 8) {
    suggestions.push({
      id: "photos-more",
      category: "photos",
      priority: "low",
      message: "A few more angles (especially the main living space and primary bedroom) can lift trust and bookings.",
    });
  }

  const rec = smart.recommendedPriceCents;
  const cur = listing.nightPriceCents;
  if (smart.marketAvgCents != null && smart.marketAvgCents > 0 && cur > smart.marketAvgCents * 1.12) {
    suggestions.push({
      id: "price-high-vs-market",
      category: "price",
      priority: "medium",
      message: `Your nightly rate is well above the typical range in ${listing.city} on BNHUB — worth checking comps unless you intentionally price premium.`,
    });
  } else if (smart.marketAvgCents != null && smart.marketAvgCents > 0 && cur < smart.marketAvgCents * 0.78) {
    suggestions.push({
      id: "price-low-vs-market",
      category: "price",
      priority: "low",
      message: "Your rate is materially below peer listings — fine for filling dates, but verify you are covering costs after fees.",
    });
  }

  if (performanceScore < 42 && (metrics?.views30d ?? 0) >= 10) {
    suggestions.push({
      id: "performance-low",
      category: "performance",
      priority: "high",
      message:
        "Traffic is showing but conversion is soft — refresh photos, tighten the title, and review minimum stay vs nearby listings.",
    });
  }

  suggestions.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });

  return {
    listingId: listing.id,
    performanceScore,
    metrics: m,
    pricing: {
      currentNightCents: cur,
      recommendedNightCents: rec,
      peerAvgNightCents: smart.marketAvgCents,
      peerListingCount: smart.peerListingCount,
    },
    suggestions: suggestions.slice(0, 8),
  };
}
