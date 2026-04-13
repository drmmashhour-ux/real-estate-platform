/**
 * User preference rollup for recommendations — builds on existing tables.
 *
 * Stored signals:
 * - `UserSearchProfile` — preferred cities, types, price band, guests, amenities (from search events)
 * - `SearchEvent` — VIEW, CLICK, SAVE, BOOK, SEARCH with optional listingId + metadata
 * - `UserBehaviorEvent` — granular BNHub/real-estate funnel events
 * - `UserIntelligenceProfile` — optional ML-enriched preferences
 * - BNHub: `BnhubGuestFavorite`, `Booking` as strong intent
 * - FSBO: `BuyerSavedListing`, `BuyerListingView`
 */

import { prisma } from "@/lib/db";
import { buildUserSearchProfileFromEvents } from "@/lib/ai/search/buildUserProfile";

/** Refresh `UserSearchProfile` from recent `SearchEvent` rows (90d). */
export async function refreshUserSearchProfileFromActivity(userId: string): Promise<void> {
  await buildUserSearchProfileFromEvents(userId);
}

export type UserPreferenceSnapshot = {
  userId: string;
  searchProfile: {
    preferredCities: string[];
    preferredTypes: string[];
    preferredPriceMin: number | null;
    preferredPriceMax: number | null;
    preferredGuests: number | null;
    preferredAmenities: string[];
  } | null;
  counts30d: {
    searchEvents: number;
    bnhubFavorites: number;
    fsboSaves: number;
  };
};

export async function getUserPreferenceSnapshot(userId: string): Promise<UserPreferenceSnapshot | null> {
  const since = new Date(Date.now() - 30 * 86400000);
  const [prof, se, fav, fsbo] = await Promise.all([
    prisma.userSearchProfile.findUnique({ where: { userId } }),
    prisma.searchEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.bnhubGuestFavorite.count({ where: { guestUserId: userId } }),
    prisma.buyerSavedListing.count({ where: { userId } }),
  ]);

  return {
    userId,
    searchProfile: prof
      ? {
          preferredCities: prof.preferredCities,
          preferredTypes: prof.preferredTypes,
          preferredPriceMin: prof.preferredPriceMin,
          preferredPriceMax: prof.preferredPriceMax,
          preferredGuests: prof.preferredGuests,
          preferredAmenities: prof.preferredAmenities,
        }
      : null,
    counts30d: {
      searchEvents: se,
      bnhubFavorites: fav,
      fsboSaves: fsbo,
    },
  };
}
