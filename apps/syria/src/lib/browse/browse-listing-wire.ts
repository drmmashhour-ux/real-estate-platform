/**
 * ORDER SYBNB-129 — Minimal JSON for browse/search APIs (slow DSL / mobile budgets).
 * Wire rows intentionally omit gallery depth, amenity arrays, and trust booleans duplicated by `badges`.
 */
import type { BrowseCtrBadgeKind } from "@/lib/sybnb/browse-card-signals";
import type { SyriaAmenityKey } from "@/lib/syria/amenities";
import type { SerializedBrowseListing, SearchPropertiesResult } from "@/services/search/search.service";

export type BrowseListingBadgesWire = {
  ctr: BrowseCtrBadgeKind[];
  amenities: SyriaAmenityKey[];
  excellentDeal?: boolean;
};

/** GET `/api/search` + `/api/sybnb/listings-lite` item shape (plus lat/lng for map pins). */
export type BrowseListingWireItem = {
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
  firstImage: string | null;
  badges: BrowseListingBadgesWire;
  views: number;
  latitude: number | null;
  longitude: number | null;
  plan: string;
  type: string;
  category: string;
  subcategory: string;
  isFeatured: boolean;
  isDirect: boolean;
  adCode: string;
  createdAt: string;
  listingVerified: boolean;
  verified: boolean;
  fraudFlag: boolean;
  sy8SellerVerified?: boolean;
  isTest?: boolean;
};

export type BrowseWireSearchResponse = {
  items: BrowseListingWireItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  amenitiesMatchRelaxed?: boolean;
  hotelStrip?: BrowseListingWireItem[];
};

function resolveWireFirstImage(row: BrowseListingWireItem | Record<string, unknown>): string | null {
  const r = row as Record<string, unknown>;
  const fi = r["firstImage"];
  if (typeof fi === "string" && fi.length > 0) return fi;
  const legacy = r["image"];
  if (typeof legacy === "string" && legacy.length > 0) return legacy;
  return null;
}

export function serializedBrowseListingToBrowseWire(row: SerializedBrowseListing): BrowseListingWireItem {
  const img = row.images[0] ?? null;
  return {
    id: row.id,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    price: row.price,
    currency: row.currency,
    pricePerNight: row.pricePerNight ?? null,
    city: row.city,
    cityAr: row.cityAr,
    cityEn: row.cityEn,
    area: row.area,
    state: row.state,
    governorate: row.governorate,
    districtAr: row.districtAr,
    districtEn: row.districtEn,
    firstImage: img,
    badges: {
      ctr: row.browseCtrBadgeKinds ?? [],
      amenities: row.browseAmenityBadgeKeys ?? [],
      excellentDeal: row.sybnbExcellentDeal === true,
    },
    views: typeof row.views === "number" ? row.views : 0,
    latitude: row.latitude,
    longitude: row.longitude,
    plan: row.plan,
    type: row.type,
    category: row.category,
    subcategory: row.subcategory,
    isFeatured: row.isFeatured,
    isDirect: row.isDirect,
    adCode: row.adCode,
    createdAt: row.createdAt,
    listingVerified: row.listingVerified,
    verified: row.verified,
    fraudFlag: row.fraudFlag,
    sy8SellerVerified: row.sy8SellerVerified,
    isTest: row.isTest === true,
  };
}

export function browseWireItemToSerializedListing(w: BrowseListingWireItem | Record<string, unknown>): SerializedBrowseListing {
  const row = w as BrowseListingWireItem & Record<string, unknown>;
  const first = resolveWireFirstImage(row);
  const ctr = Array.isArray(row.badges?.ctr) ? row.badges.ctr : [];
  const amenKeys = Array.isArray(row.badges?.amenities) ? row.badges.amenities : [];
  const excellent = row.badges?.excellentDeal === true;

  return {
    id: String(row.id),
    titleAr: String(row.titleAr ?? ""),
    titleEn: row.titleEn ?? null,
    state: String(row.state ?? ""),
    governorate: row.governorate ?? null,
    city: String(row.city ?? ""),
    cityAr: row.cityAr ?? null,
    cityEn: row.cityEn ?? null,
    area: row.area ?? null,
    districtAr: row.districtAr ?? null,
    districtEn: row.districtEn ?? null,
    addressDetails: null,
    price: String(row.price ?? ""),
    currency: String(row.currency ?? ""),
    type: String(row.type ?? ""),
    isFeatured: Boolean(row.isFeatured),
    plan: String(row.plan ?? ""),
    images: first ? [first] : [],
    listingPhotoCount: 0,
    amenities: [],
    latitude: typeof row.latitude === "number" ? row.latitude : row.latitude != null ? Number(row.latitude) : null,
    longitude: typeof row.longitude === "number" ? row.longitude : row.longitude != null ? Number(row.longitude) : null,
    listingVerified: Boolean(row.listingVerified),
    verified: Boolean(row.verified),
    fraudFlag: Boolean(row.fraudFlag),
    isDirect: Boolean(row.isDirect),
    adCode: String(row.adCode ?? ""),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
    proofDocumentsSubmitted: false,
    ownershipVerified: false,
    postingKind: null,
    category: String(row.category ?? ""),
    subcategory: String(row.subcategory ?? ""),
    pricePerNight:
      row.pricePerNight != null && typeof row.pricePerNight === "number" ? row.pricePerNight : row.pricePerNight != null ? Number(row.pricePerNight) : null,
    isTest: row.isTest === true,
    amenityCount: amenKeys.length,
    browseCtrBadgeKinds: ctr.length > 0 ? ctr : undefined,
    browseAmenityBadgeKeys: amenKeys.length > 0 ? amenKeys : undefined,
    sybnbExcellentDeal: excellent,
    sy8SellerVerified: row.sy8SellerVerified === true ? true : undefined,
    views: typeof row.views === "number" ? row.views : Number(row.views) || 0,
  };
}

export function browseWireSearchResponseToSearchResult(body: BrowseWireSearchResponse): SearchPropertiesResult {
  return {
    items: body.items.map((it) => browseWireItemToSerializedListing(it)),
    total: body.total,
    page: body.page,
    pageSize: body.pageSize,
    hasMore: body.hasMore,
    amenitiesMatchRelaxed: body.amenitiesMatchRelaxed,
  };
}

export function searchPropertiesResultToBrowseWireResponse(full: SearchPropertiesResult): BrowseWireSearchResponse {
  return {
    items: full.items.map(serializedBrowseListingToBrowseWire),
    total: full.total,
    page: full.page,
    pageSize: full.pageSize,
    hasMore: full.hasMore,
    amenitiesMatchRelaxed: full.amenitiesMatchRelaxed,
  };
}

/** Client + offline snapshots: accepts SYBNB-129 wire or legacy fat `SearchPropertiesResult`. */
export function parseBrowseSearchResponseJson(raw: unknown): SearchPropertiesResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid browse response");
  }
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) {
    throw new Error("invalid browse response items");
  }
  if (o.items.length === 0) {
    return {
      items: [],
      total: Number(o.total) || 0,
      page: Number(o.page) || 1,
      pageSize: Number(o.pageSize) || 10,
      hasMore: Boolean(o.hasMore),
      amenitiesMatchRelaxed: o.amenitiesMatchRelaxed === true,
    };
  }
  const row0 = o.items[0] as Record<string, unknown>;
  if ("images" in row0 && Array.isArray(row0.images)) {
    return raw as SearchPropertiesResult;
  }
  if ("firstImage" in row0 || "image" in row0) {
    return browseWireSearchResponseToSearchResult(raw as BrowseWireSearchResponse);
  }
  return raw as SearchPropertiesResult;
}
