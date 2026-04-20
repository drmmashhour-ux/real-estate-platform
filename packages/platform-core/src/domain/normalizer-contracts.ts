/**
 * Contracts for regional adapters — implementations live in apps; no IO here.
 */

import type {
  NormalizedBooking,
  NormalizedListing,
  NormalizedUserProfile,
} from "./normalized-listing.types";

export interface ListingNormalizerResult {
  listing: NormalizedListing | null;
  availabilityNotes: readonly string[];
}

export interface ListingNormalizer {
  getListingById(listingId: string): Promise<ListingNormalizerResult>;
  listListingsSummary(limit?: number): Promise<{
    items: NormalizedListing[];
    availabilityNotes: readonly string[];
  }>;
}

export interface BookingNormalizer {
  getBookingStats(propertyId: string): Promise<{
    data: Record<string, unknown> | null;
    availabilityNotes: readonly string[];
  }>;
  normalizeBooking(raw: unknown): NormalizedBooking | null;
}

export interface UserNormalizer {
  normalizeUser(raw: unknown): NormalizedUserProfile | null;
}

/** Regional façade expected by web intelligence wiring. */
export interface RegionDataAdapter extends ListingNormalizer, Partial<BookingNormalizer>, Partial<UserNormalizer> {
  readonly regionCode: string;
  normalizeListing(raw: unknown): NormalizedListing | null;
}
