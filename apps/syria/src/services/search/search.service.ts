import { prisma } from "@/lib/db";
import { syriaFlags } from "@/lib/platform-flags";
import type { SyriaProperty } from "@/generated/prisma";
import { haversineKm } from "@/lib/geo";
import { listingBrowseOrderBy, listingBrowseOrderBySybnb } from "@/lib/listing-order";
import type { ListingKind } from "@/lib/property-search";
import {
  buildPropertyWhere,
  listingMatchesAmenityTags,
  parseAmenityTags,
  parseSearchNumber,
} from "@/lib/property-search";
import { getSy8OwnerListingCountsMap } from "@/lib/sy8/sy8-owner-listing-counts";
import {
  computeSy8SellerScore,
  isSy8SellerVerified,
  sy8ReputationLabelId,
  type Sy8ReputationTier,
} from "@/lib/sy8/sy8-reputation";
import { computeSybnbExcellentDealFlags } from "@/lib/sybnb/smart-pricing";
import { capBoostedFirstPage, getSybnbFeaturedMaxPerPage } from "@/lib/sybnb/featured-feed-cap";

export type BrowseSurface = "sale" | "rent" | "bnhub" | "stay";

export type SerializedBrowseListing = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  state: string;
  governorate: string | null;
  city: string;
  cityAr: string | null;
  cityEn: string | null;
  area: string | null;
  districtAr: string | null;
  districtEn: string | null;
  addressDetails: string | null;
  price: string;
  currency: string;
  type: string;
  isFeatured: boolean;
  plan: string;
  images: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  guestsMax: number | null;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  listingVerified: boolean;
  /** SY-11 marketplace trust flag */
  verified: boolean;
  /** SY-22: no broker / direct owner */
  isDirect: boolean;
  /** SY-28 */
  adCode: string;
  /** ISO */
  createdAt: string;
  /** Page views (simple counter) */
  views: number;
  category: string;
  subcategory: string;
  /** Nightly SYP for SYBNB; null if unset. */
  pricePerNight: number | null;
  /** SY8: present when the row came from `searchProperties` (browse). */
  sy8SellerVerified?: boolean;
  sy8ReputationScore?: number;
  sy8ReputationLabelId?: Sy8ReputationTier;
  sybnbExcellentDeal?: boolean;
};

export type SearchPropertiesResult = {
  items: SerializedBrowseListing[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function surfaceToKind(surface: BrowseSurface): ListingKind {
  if (surface === "sale") return "sale";
  if (surface === "rent") return "rent";
  if (surface === "stay") return "stay";
  return "bnhub";
}

type PropertyWithOwnerForSy8 = SyriaProperty & {
  owner: { phoneVerifiedAt: Date | null; verifiedAt: Date | null; verificationLevel: string | null };
};

const ownerSelectSy8 = { owner: { select: { phoneVerifiedAt: true, verifiedAt: true, verificationLevel: true } } };

function baseFields(p: SyriaProperty) {
  return {
    id: p.id,
    titleAr: p.titleAr,
    titleEn: p.titleEn,
    descriptionAr: p.descriptionAr,
    descriptionEn: p.descriptionEn,
    state: p.state,
    governorate: p.governorate ?? null,
    city: p.city,
    cityAr: p.cityAr ?? null,
    cityEn: p.cityEn ?? null,
    area: p.area,
    districtAr: p.districtAr ?? null,
    districtEn: p.districtEn ?? null,
    addressDetails: p.addressDetails ?? null,
    price: p.price.toString(),
    currency: p.currency,
    type: p.type,
    isFeatured: p.isFeatured,
    plan: p.plan,
    images: p.images,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    guestsMax: p.guestsMax ?? null,
    amenities: p.amenities,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    listingVerified: p.listingVerified,
    verified: p.verified,
    isDirect: p.isDirect,
    adCode: p.adCode,
    createdAt: p.createdAt.toISOString(),
    views: p.views,
    category: p.category,
    subcategory: p.subcategory,
    pricePerNight: p.pricePerNight ?? null,
  };
}

async function serializeWithSy8(rows: PropertyWithOwnerForSy8[]): Promise<SerializedBrowseListing[]> {
  if (rows.length === 0) return [];
  const countMap = await getSy8OwnerListingCountsMap(rows.map((r) => r.ownerId));
  return rows.map((p) => {
    const c = countMap.get(p.ownerId) ?? { activeListings: 0, soldListings: 0 };
    const sy8ReputationScore = computeSy8SellerScore(c.soldListings, c.activeListings);
    return {
      ...baseFields(p),
      sy8SellerVerified: isSy8SellerVerified(p.owner),
      sy8ReputationScore,
      sy8ReputationLabelId: sy8ReputationLabelId(sy8ReputationScore),
    };
  });
}

function applySybnbExcellentDealFlags(list: SerializedBrowseListing[]): SerializedBrowseListing[] {
  const flags = computeSybnbExcellentDealFlags(list);
  return list.map((s) => ({ ...s, sybnbExcellentDeal: flags.get(s.id) === true }));
}

async function serializeBrowseRows(rows: PropertyWithOwnerForSy8[], surface: BrowseSurface): Promise<SerializedBrowseListing[]> {
  const base = await serializeWithSy8(rows);
  if (surface === "stay") {
    return applySybnbExcellentDealFlags(base);
  }
  return base;
}

/** Ensures geo filter has a sensible radius when lat/lng present but radius omitted. */
function normalizeSearchParams(sp: Record<string, string>): Record<string, string> {
  const next = { ...sp };
  const lat = parseSearchNumber(next.lat);
  const lng = parseSearchNumber(next.lng);
  const rad = parseSearchNumber(next.radius);
  if (lat !== undefined && lng !== undefined && rad === undefined) {
    next.radius = "15";
  }
  return next;
}

/**
 * Unified browse + API search. Handles amenity substring matching (JSON amenities array),
 * bbox geo filter via `buildPropertyWhere`, and optional distance sort when lat/lng exist.
 */
export async function searchProperties(
  surface: BrowseSurface,
  rawParams: Record<string, string>,
): Promise<SearchPropertiesResult> {
  const kind = surfaceToKind(surface);
  const flatMvp: Record<string, string> = normalizeSearchParams(rawParams);
  if (surface === "stay") {
    flatMvp.category = "stay";
  }
  const flat: Record<string, string> = syriaFlags.SYRIA_MVP
    ? ((() => {
        const allow = new Set([
          "q",
          "city",
          "state",
          "features",
          "minPrice",
          "maxPrice",
          "page",
          "pageSize",
          "sort",
          "governorate",
          "category",
          "subcategory",
          "direct",
        ]);
        return Object.fromEntries(Object.entries(flatMvp).filter(([k]) => allow.has(k)));
      })() as Record<string, string>)
    : flatMvp;

  const page = Math.min(500, Math.max(1, parseSearchNumber(flat.page) ?? 1));
  const pageSize = Math.min(48, Math.max(1, parseSearchNumber(flat.pageSize) ?? 24));
  const sort = (flat.sort ?? "featured").trim();

  const amenityTags = parseAmenityTags(flat.amenities);
  const centerLat = parseSearchNumber(flat.lat);
  const centerLng = parseSearchNumber(flat.lng);

  const where = buildPropertyWhere(kind, flat);
  const orderBy = surface === "stay" ? listingBrowseOrderBySybnb : listingBrowseOrderBy;

  const useDistanceSort = sort === "distance" && centerLat !== undefined && centerLng !== undefined;

  if (useDistanceSort) {
    const capped = await prisma.syriaProperty.findMany({
      where: {
        ...where,
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 450,
      orderBy: orderBy("featured"),
      include: ownerSelectSy8,
    });
    let rows = capped.filter((r) => r.latitude != null && r.longitude != null);
    if (amenityTags.length > 0) {
      rows = rows.filter((r) => listingMatchesAmenityTags(r.amenities, amenityTags));
    }
    rows.sort((a, b) => {
      const d =
        haversineKm(centerLat!, centerLng!, a.latitude!, a.longitude!) -
        haversineKm(centerLat!, centerLng!, b.latitude!, b.longitude!);
      if (d !== 0) return d;
      if (a.isDirect === b.isDirect) return 0;
      return a.isDirect ? -1 : 1;
    });
    const total = rows.length;
    let sliced = rows.slice((page - 1) * pageSize, page * pageSize) as PropertyWithOwnerForSy8[];
    if (surface === "stay" && page === 1) {
      const pool = rows.slice(0, Math.min(rows.length, page * pageSize + 160));
      sliced = capBoostedFirstPage(pool, pageSize, getSybnbFeaturedMaxPerPage());
    }
    return {
      items: await serializeBrowseRows(sliced, surface),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  if (amenityTags.length > 0) {
    const fetched = await prisma.syriaProperty.findMany({
      where,
      orderBy: orderBy(sort === "distance" ? "featured" : sort),
      take: 1200,
      include: ownerSelectSy8,
    });
    const filtered = fetched.filter((r) => listingMatchesAmenityTags(r.amenities, amenityTags));
    const total = filtered.length;
    let sliced = filtered.slice((page - 1) * pageSize, page * pageSize);
    if (surface === "stay" && page === 1) {
      const pool = filtered.slice(0, Math.min(filtered.length, page * pageSize + 160));
      sliced = capBoostedFirstPage(pool as PropertyWithOwnerForSy8[], pageSize, getSybnbFeaturedMaxPerPage());
    }
    return {
      items: await serializeBrowseRows(sliced as PropertyWithOwnerForSy8[], surface),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  const total = await prisma.syriaProperty.count({ where });

  let rows: PropertyWithOwnerForSy8[];

  if (surface === "stay" && page === 1 && !useDistanceSort && amenityTags.length === 0) {
    const pool = await prisma.syriaProperty.findMany({
      where,
      orderBy: orderBy(sort === "distance" ? "featured" : sort),
      skip: 0,
      take: Math.min(pageSize + 160, 300),
      include: ownerSelectSy8,
    });
    rows = capBoostedFirstPage(pool as PropertyWithOwnerForSy8[], pageSize, getSybnbFeaturedMaxPerPage());
  } else {
    rows = (await prisma.syriaProperty.findMany({
      where,
      orderBy: orderBy(sort === "distance" ? "featured" : sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: ownerSelectSy8,
    })) as PropertyWithOwnerForSy8[];
  }

  return {
    items: await serializeBrowseRows(rows as PropertyWithOwnerForSy8[], surface),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
