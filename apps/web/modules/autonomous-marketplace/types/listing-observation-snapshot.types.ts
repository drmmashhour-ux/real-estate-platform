/**
 * Read-only listing metrics for preview / observation (no writes).
 * `price` is `priceCents` from `fsbo_listings` (integer cents).
 * `conversionRate` is a simple ratio 0..+∞ (same construction as `buildObservationForListing` facts).
 */
export type ListingObservationSnapshot = {
  views: number;
  bookings: number;
  conversionRate: number;
  price: number;
  listingStatus: string;
};
