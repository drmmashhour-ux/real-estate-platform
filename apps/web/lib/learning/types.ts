/**
 * Normalized listing features for learning + future ML export (BNHUB-first).
 */
export type ListingLearningFeatures = {
  listingId: string;
  city: string;
  region: string | null;
  country: string;
  category: "stay";
  propertyType: string | null;
  roomType: string | null;
  priceBucket: string;
  nightPriceCents: number;
  bedrooms: number | null;
  beds: number;
  baths: number;
  maxGuests: number;
  /** Coarse amenity / feature flags */
  hasParking: boolean;
  hasPool: boolean;
  hasBalcony: boolean;
  hasKitchen: boolean;
  petFriendly: boolean;
  /** Freshness bucket: fresh | recent | mature */
  freshnessBucket: "fresh" | "recent" | "mature";
  featuredPromotion: boolean;
  verificationStatus: string;
};

export type ContextPreferenceVector = {
  cities: Map<string, number>;
  propertyTypes: Map<string, number>;
  priceBands: Map<string, number>;
  beds: Map<string, number>;
  amenities: Map<string, number>;
  categories: Map<string, number>;
};
