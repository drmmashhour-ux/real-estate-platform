/**
 * BNHub SearchService — search listings by location, price, guests, amenities.
 * Delegates to lib/bnhub/listings.
 */

import { searchListings, type ListingSearchParams } from "@/lib/bnhub/listings";

export const SearchService = {
  /**
   * Search listings by location, dates, price range, guests, amenities (via listing data), property type.
   */
  searchListings(params: ListingSearchParams) {
    return searchListings(params);
  },
};
