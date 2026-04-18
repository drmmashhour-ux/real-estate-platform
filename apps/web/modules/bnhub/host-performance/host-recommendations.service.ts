/**
 * Deterministic, advisory recommendations for BNHub hosts — no auto-fixes.
 */

import type { BNHubListingScoreBreakdown } from "@/modules/bnhub/ranking/bnhub-ranking.types";
import type { BNHubHostRecommendation } from "./host-performance.types";

function safePhotosCount(photos: unknown): number {
  return Array.isArray(photos) ? photos.filter((x) => typeof x === "string" && x.length > 0).length : 0;
}

function safeAmenitiesCount(amenities: unknown): number {
  return Array.isArray(amenities) ? amenities.length : 0;
}

export type HostListingRecommendationInput = {
  listingId: string;
  description?: string | null;
  amenities: unknown;
  photos: unknown;
  updatedAt: Date;
  breakdown?: Partial<BNHubListingScoreBreakdown>;
};

/**
 * Builds ordered recommendations from ranking breakdown + listing snapshot.
 */
export function buildHostListingRecommendations(
  listing: HostListingRecommendationInput,
  rankingBreakdown?: Partial<BNHubListingScoreBreakdown>,
): BNHubHostRecommendation[] {
  const b = rankingBreakdown ?? listing.breakdown ?? {};
  const out: BNHubHostRecommendation[] = [];
  const photos = safePhotosCount(listing.photos);
  const amenities = safeAmenitiesCount(listing.amenities);
  const descLen = (listing.description ?? "").trim().length;
  const daysSinceUpdate = (Date.now() - listing.updatedAt.getTime()) / 864e5;

  if (photos < 3) {
    out.push({
      id: `${listing.listingId}:photos_min`,
      category: "photos",
      title: "Add more photos",
      description: "Guests compare listings visually; several clear photos usually improve engagement.",
      impact: photos === 0 ? "high" : "medium",
      why: `Currently ${photos} photo(s); three or more is a common baseline for search cards.`,
    });
  }

  if (amenities < 3) {
    out.push({
      id: `${listing.listingId}:amenities_min`,
      category: "amenities",
      title: "List more amenities",
      description: "Accurate amenities help guests filter and set expectations before booking.",
      impact: "medium",
      why: `Amenity count is ${amenities}; expanding the list can improve match quality.`,
    });
  }

  if (descLen < 80) {
    out.push({
      id: `${listing.listingId}:description_short`,
      category: "description",
      title: "Improve description clarity",
      description: "A short paragraph on space, access, and what makes the stay distinct helps conversion.",
      impact: descLen < 20 ? "high" : "low",
      why: `Description length is ${descLen} characters; fuller copy supports discovery and trust.`,
    });
  }

  if ((b.trustScore ?? 99) < 10) {
    out.push({
      id: `${listing.listingId}:trust`,
      category: "trust",
      title: "Build trust with reviews",
      description: "Completed stays and guest reviews strengthen your listing’s trust signals over time.",
      impact: "high",
      why: "Trust score is on the lower side — more completed stays and reviews typically help.",
    });
  }

  if ((b.freshnessScore ?? 99) < 6) {
    out.push({
      id: `${listing.listingId}:freshness`,
      category: "freshness",
      title: "Refresh listing details",
      description: "Periodic updates signal an active listing and can help with discovery freshness.",
      impact: "medium",
      why:
        daysSinceUpdate > 120
          ? "Last update was a while ago; a quick refresh of text or photos can help."
          : "Freshness score suggests room to update details when you have time.",
    });
  }

  if ((b.priceCompetitivenessScore ?? 99) < 11) {
    out.push({
      id: `${listing.listingId}:pricing`,
      category: "pricing",
      title: "Review nightly price competitiveness",
      description: "Compare your nightly rate to similar stays in your area; small adjustments can change visibility.",
      impact: "medium",
      why: "Price competitiveness score is below typical “fair” bands for similar listings — advisory only.",
    });
  }

  if ((b.conversionScore ?? 99) < 12) {
    out.push({
      id: `${listing.listingId}:conversion`,
      category: "trust",
      title: "Improve booking signals",
      description: "More completed bookings and engagement over time can strengthen conversion-related signals.",
      impact: "low",
      why: "Conversion-related score is in a neutral or lower band — expected for newer listings.",
    });
  }

  return out.slice(0, 8);
}
