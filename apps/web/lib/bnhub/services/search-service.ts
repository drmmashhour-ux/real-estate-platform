/**
 * BNHUB SearchService — search listings by location, price, guests, amenities.
 * Delegates to lib/bnhub/listings.
 */

import {
  searchListings,
  searchListingsPaginated,
  type ListingSearchParams,
  type SearchListingsResult,
} from "@/lib/bnhub/listings";

export const SearchService = {
  searchListings(params: ListingSearchParams) {
    return searchListings(params);
  },

  /**
   * Paginated search: where + take + skip. Use for API with limit, page.
   */
  searchListingsPaginated(params: ListingSearchParams): Promise<SearchListingsResult> {
    return searchListingsPaginated(params);
  },
};
