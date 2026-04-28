/**
 * ORDER SYBNB-81 / SYBNB-91 — Minimal SYBNB browse wire: smallest JSON for listing cards + map pins.
 * SYBNB-91 — omit views/bedrooms/bathrooms/guests on wire (detail page loads full rows).
 * Full copy loads only on `/listing/[id]` or `/sybnb/listings/[id]`.
 */
import { parseSearchNumber } from "@/lib/property-search";
import type { BrowseCtrBadgeKind } from "@/lib/sybnb/browse-card-signals";
import type { SyriaAmenityKey } from "@/lib/syria/amenities";
import type { SerializedBrowseListing, SearchPropertiesResult } from "@/services/search/search.service";

/** ORDER SYBNB-81 / SYBNB-104 — allowed page sizes for lite browse API (cap 10; min 8 for data-saver fetches). */
export const SYBNB81_LITE_PAGE_MIN = 8;
export const SYBNB81_LITE_PAGE_MAX = 10;
export const SYBNB81_LITE_PAGE_DEFAULT = 10;

export type SybnbListingBadgesLite = {
  ctr: BrowseCtrBadgeKind[];
  amenities: SyriaAmenityKey[];
  excellentDeal?: boolean;
};

/** Minimal fields for grid + cards (no descriptions, one image URL, badge hints only). */
export type SybnbListingLiteItem = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  price: string;
  currency: string;
  pricePerNight: number | null;
  city: string;
  cityAr: string | null;
  cityEn: string | null;
  area: string | null;
  state: string;
  governorate: string | null;
  districtAr: string | null;
  districtEn: string | null;
  image: string | null;
  listingPhotoCount: number;
  latitude: number | null;
  longitude: number | null;
  plan: string;
  adCode: string;
  isFeatured: boolean;
  type: string;
  category: string;
  subcategory: string;
  createdAt: string;
  isDirect: boolean;
  listingVerified: boolean;
  verified: boolean;
  fraudFlag: boolean;
  proofDocumentsSubmitted: boolean;
  ownershipVerified: boolean;
  postingKind: string | null;
  sy8SellerVerified?: boolean;
  isTest?: boolean;
  /** Mirrors browse wire — trusted-badge amenity threshold. */
  amenityCount: number;
  badges: SybnbListingBadgesLite;
};

export type SybnbListingsLiteResponse = {
  items: SybnbListingLiteItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  amenitiesMatchRelaxed?: boolean;
  /** When `stripHotels=1` on `/api/sybnb/listings-lite` — one round-trip for stays + verified hotels strip (SYBNB-82). */
  hotelStrip?: SybnbListingLiteItem[];
};

export function clampSybnbLitePageSize(raw?: string): number {
  const n = parseSearchNumber(raw);
  if (n === undefined) return SYBNB81_LITE_PAGE_DEFAULT;
  return Math.min(SYBNB81_LITE_PAGE_MAX, Math.max(SYBNB81_LITE_PAGE_MIN, n));
}

export function serializedBrowseListingToLite(row: SerializedBrowseListing): SybnbListingLiteItem {
  const img = row.images[0] ?? null;
  return {
    id: row.id,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    price: row.price,
    currency: row.currency,
    pricePerNight: row.pricePerNight,
    city: row.city,
    cityAr: row.cityAr,
    cityEn: row.cityEn,
    area: row.area,
    state: row.state,
    governorate: row.governorate,
    districtAr: row.districtAr,
    districtEn: row.districtEn,
    image: img,
    listingPhotoCount: row.listingPhotoCount,
    latitude: row.latitude,
    longitude: row.longitude,
    plan: row.plan,
    adCode: row.adCode,
    isFeatured: row.isFeatured,
    type: row.type,
    category: row.category,
    subcategory: row.subcategory,
    createdAt: row.createdAt,
    isDirect: row.isDirect,
    listingVerified: row.listingVerified,
    verified: row.verified,
    fraudFlag: row.fraudFlag,
    proofDocumentsSubmitted: row.proofDocumentsSubmitted,
    ownershipVerified: row.ownershipVerified,
    postingKind: row.postingKind,
    sy8SellerVerified: row.sy8SellerVerified,
    isTest: row.isTest === true,
    amenityCount: row.amenityCount,
    badges: {
      ctr: row.browseCtrBadgeKinds ?? [],
      amenities: row.browseAmenityBadgeKeys ?? [],
      excellentDeal: row.sybnbExcellentDeal === true,
    },
  };
}

export function sybnbLiteItemToSerializedBrowse(lite: SybnbListingLiteItem): SerializedBrowseListing {
  const ctr = lite.badges.ctr;
  const amenityKeys = lite.badges.amenities;
  return {
    id: lite.id,
    titleAr: lite.titleAr,
    titleEn: lite.titleEn,
    state: lite.state,
    governorate: lite.governorate,
    city: lite.city,
    cityAr: lite.cityAr,
    cityEn: lite.cityEn,
    area: lite.area,
    districtAr: lite.districtAr,
    districtEn: lite.districtEn,
    addressDetails: null,
    price: lite.price,
    currency: lite.currency,
    type: lite.type,
    isFeatured: lite.isFeatured,
    plan: lite.plan,
    images: lite.image ? [lite.image] : [],
    listingPhotoCount: lite.listingPhotoCount,
    amenities: [],
    latitude: lite.latitude,
    longitude: lite.longitude,
    listingVerified: lite.listingVerified,
    verified: lite.verified,
    fraudFlag: lite.fraudFlag,
    isDirect: lite.isDirect,
    adCode: lite.adCode,
    createdAt: lite.createdAt,
    category: lite.category,
    subcategory: lite.subcategory,
    pricePerNight: lite.pricePerNight,
    proofDocumentsSubmitted: lite.proofDocumentsSubmitted ?? false,
    ownershipVerified: lite.ownershipVerified ?? false,
    postingKind: lite.postingKind ?? null,
    sy8SellerVerified: lite.sy8SellerVerified,
    sybnbExcellentDeal: lite.badges.excellentDeal,
    isTest: lite.isTest === true,
    amenityCount: lite.amenityCount,
    browseCtrBadgeKinds: ctr.length > 0 ? ctr : undefined,
    browseAmenityBadgeKeys: amenityKeys.length > 0 ? amenityKeys : undefined,
  };
}

export function searchPropertiesResultToSybnbLiteResponse(full: SearchPropertiesResult): SybnbListingsLiteResponse {
  return {
    items: full.items.map(serializedBrowseListingToLite),
    total: full.total,
    page: full.page,
    pageSize: full.pageSize,
    hasMore: full.hasMore,
    amenitiesMatchRelaxed: full.amenitiesMatchRelaxed,
  };
}

export function sybnbListingsLiteResponseToSearchResult(body: SybnbListingsLiteResponse): SearchPropertiesResult {
  return {
    items: body.items.map(sybnbLiteItemToSerializedBrowse),
    total: body.total,
    page: body.page,
    pageSize: body.pageSize,
    hasMore: body.hasMore,
    amenitiesMatchRelaxed: body.amenitiesMatchRelaxed,
  };
}

/** SSR path — same projection as `/api/sybnb/listings-lite` so first paint matches client fetches. */
export function sybnbStayBrowseResultViaLiteProjection(full: SearchPropertiesResult): SearchPropertiesResult {
  return sybnbListingsLiteResponseToSearchResult(searchPropertiesResultToSybnbLiteResponse(full));
}
