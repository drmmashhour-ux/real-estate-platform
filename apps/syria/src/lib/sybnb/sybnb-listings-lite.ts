/**
 * ORDER SYBNB-81 / SYBNB-91 / SYBNB-129 — SYBNB browse lite aliases around `@/lib/browse/browse-listing-wire`.
 */
import type { BrowseListingWireItem } from "@/lib/browse/browse-listing-wire";
import {
  browseWireItemToSerializedListing,
  browseWireSearchResponseToSearchResult,
  searchPropertiesResultToBrowseWireResponse,
  serializedBrowseListingToBrowseWire,
} from "@/lib/browse/browse-listing-wire";
import { parseSearchNumber } from "@/lib/property-search";
import type { SearchPropertiesResult } from "@/services/search/search.service";

/** ORDER SYBNB-129 — fixed **10** rows per fetch (slow-network budgets). */
export const SYBNB81_LITE_PAGE_MIN = 10;
export const SYBNB81_LITE_PAGE_MAX = 10;
export const SYBNB81_LITE_PAGE_DEFAULT = 10;

export function clampSybnbLitePageSize(raw?: string): number {
  const n = parseSearchNumber(raw);
  if (n === undefined) return SYBNB81_LITE_PAGE_DEFAULT;
  return Math.min(SYBNB81_LITE_PAGE_MAX, Math.max(SYBNB81_LITE_PAGE_MIN, n));
}

export type SybnbListingBadgesLite = BrowseListingWireItem["badges"];
export type SybnbListingLiteItem = BrowseListingWireItem;

export type SybnbListingsLiteResponse = ReturnType<typeof searchPropertiesResultToBrowseWireResponse> & {
  hotelStrip?: BrowseListingWireItem[];
};

export const serializedBrowseListingToLite = serializedBrowseListingToBrowseWire;

export const sybnbLiteItemToSerializedBrowse = browseWireItemToSerializedListing;

export function searchPropertiesResultToSybnbLiteResponse(full: SearchPropertiesResult): SybnbListingsLiteResponse {
  return searchPropertiesResultToBrowseWireResponse(full);
}

export function sybnbListingsLiteResponseToSearchResult(body: SybnbListingsLiteResponse): SearchPropertiesResult {
  const { hotelStrip: _strip, ...rest } = body;
  void _strip;
  return browseWireSearchResponseToSearchResult(rest);
}

/** SSR path — same projection as `/api/sybnb/listings-lite` so first paint matches client fetches. */
export function sybnbStayBrowseResultViaLiteProjection(full: SearchPropertiesResult): SearchPropertiesResult {
  return sybnbListingsLiteResponseToSearchResult(searchPropertiesResultToSybnbLiteResponse(full));
}
