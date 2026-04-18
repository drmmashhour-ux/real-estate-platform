/**
 * BNHub listing monetization hooks — maps product concepts to existing tables (no new columns).
 *
 * - **Featured placement:** `FeaturedListing` rows + `getActivePromotedListingIds` in search (`lib/bnhub/listings.ts`).
 * - **Boost score:** in-memory ranking uses marketing + growth boosts (`getMarketingSearchBoostByListingId`, `getGrowthSearchBoostByListingId`).
 * - **Stripe platform fee:** `bnhubBookingFeeSplitCents` / checkout metadata — see `lib/stripe/bnhub-connect.ts`.
 */

import { FeaturedListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getGrowthSearchBoostByListingId } from "@/src/modules/bnhub-growth-engine/services/growthFeaturedBridge";

export async function isListingFeaturedBnhub(listingId: string): Promise<boolean> {
  const featured = await getActivePromotedListingIds({ placement: "FEATURED", limit: 64 });
  return featured.includes(listingId);
}

export async function getListingBoostScoreBnhub(listingId: string): Promise<number> {
  const map = await getGrowthSearchBoostByListingId();
  return map.get(listingId) ?? 0;
}

/** Active paid featured windows (`featured_listings` audit). */
export async function countActiveFeaturedListingRows(): Promise<number> {
  return prisma.featuredListing.count({
    where: {
      listingKind: "bnhub",
      status: FeaturedListingStatus.active,
      endAt: { gte: new Date() },
    },
  });
}
