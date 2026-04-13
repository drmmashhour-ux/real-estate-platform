import type { ShortTermListing } from "@prisma/client";
import type { ListingLearningFeatures } from "@/lib/learning/types";

function priceBandFromCents(cents: number): string {
  const n = cents / 100;
  if (n < 80) return "0-80";
  if (n < 120) return "80-120";
  if (n < 180) return "120-180";
  if (n < 260) return "180-260";
  if (n < 400) return "260-400";
  return "400+";
}

function amenityHas(amenities: unknown, needle: string): boolean {
  if (!Array.isArray(amenities)) return false;
  const s = JSON.stringify(amenities).toLowerCase();
  return s.includes(needle.toLowerCase());
}

function freshnessBucket(createdAt: Date): ListingLearningFeatures["freshnessBucket"] {
  const days = (Date.now() - createdAt.getTime()) / 86400000;
  if (days <= 30) return "fresh";
  if (days <= 180) return "recent";
  return "mature";
}

/**
 * Build a normalized feature object from a BNHUB short-term listing row.
 */
export function extractListingLearningFeatures(
  listing: Pick<
    ShortTermListing,
    | "id"
    | "city"
    | "region"
    | "country"
    | "propertyType"
    | "roomType"
    | "nightPriceCents"
    | "bedrooms"
    | "beds"
    | "baths"
    | "maxGuests"
    | "amenities"
    | "petsAllowed"
    | "createdAt"
    | "verificationStatus"
  > & { hasActivePromotion?: boolean }
): ListingLearningFeatures {
  const am = listing.amenities;
  return {
    listingId: listing.id,
    city: listing.city.trim() || "unknown",
    region: listing.region ?? null,
    country: listing.country || "US",
    category: "stay",
    propertyType: listing.propertyType ?? null,
    roomType: listing.roomType ?? null,
    priceBucket: priceBandFromCents(listing.nightPriceCents),
    nightPriceCents: listing.nightPriceCents,
    bedrooms: listing.bedrooms ?? null,
    beds: listing.beds,
    baths: listing.baths,
    maxGuests: listing.maxGuests,
    hasParking: amenityHas(am, "parking") || amenityHas(am, "garage"),
    hasPool: amenityHas(am, "pool"),
    hasBalcony: amenityHas(am, "balcony") || amenityHas(am, "patio"),
    hasKitchen: amenityHas(am, "kitchen"),
    petFriendly: listing.petsAllowed === true,
    freshnessBucket: freshnessBucket(listing.createdAt),
    featuredPromotion: false,
    verificationStatus: listing.verificationStatus,
  };
}
