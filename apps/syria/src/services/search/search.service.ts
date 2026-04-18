import { prisma } from "@/lib/db";
import type { SyriaProperty } from "@/generated/prisma";
import { haversineKm } from "@/lib/geo";
import { listingBrowseOrderBy } from "@/lib/listing-order";
import type { ListingKind } from "@/lib/property-search";
import {
  buildPropertyWhere,
  listingMatchesAmenityTags,
  parseAmenityTags,
  parseSearchNumber,
} from "@/lib/property-search";

export type BrowseSurface = "sale" | "rent" | "bnhub";

export type SerializedBrowseListing = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  city: string;
  area: string | null;
  price: string;
  currency: string;
  type: string;
  isFeatured: boolean;
  images: unknown;
  bedrooms: number | null;
  bathrooms: number | null;
  guestsMax: number | null;
  amenities: unknown;
  latitude: number | null;
  longitude: number | null;
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
  return "bnhub";
}

function serialize(p: SyriaProperty): SerializedBrowseListing {
  return {
    id: p.id,
    titleAr: p.titleAr,
    titleEn: p.titleEn,
    city: p.city,
    area: p.area,
    price: p.price.toString(),
    currency: p.currency,
    type: p.type,
    isFeatured: p.isFeatured,
    images: p.images,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    guestsMax: p.guestsMax ?? null,
    amenities: p.amenities,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
  };
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
  const flat = normalizeSearchParams(rawParams);

  const page = Math.min(500, Math.max(1, parseSearchNumber(flat.page) ?? 1));
  const pageSize = Math.min(48, Math.max(1, parseSearchNumber(flat.pageSize) ?? 24));
  const sort = (flat.sort ?? "featured").trim();

  const amenityTags = parseAmenityTags(flat.amenities);
  const centerLat = parseSearchNumber(flat.lat);
  const centerLng = parseSearchNumber(flat.lng);

  const where = buildPropertyWhere(kind, flat);

  const useDistanceSort = sort === "distance" && centerLat !== undefined && centerLng !== undefined;

  if (useDistanceSort) {
    const capped = await prisma.syriaProperty.findMany({
      where: {
        ...where,
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 450,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
    let rows = capped.filter((r) => r.latitude != null && r.longitude != null);
    if (amenityTags.length > 0) {
      rows = rows.filter((r) => listingMatchesAmenityTags(r.amenities, amenityTags));
    }
    rows.sort(
      (a, b) =>
        haversineKm(centerLat!, centerLng!, a.latitude!, a.longitude!) -
        haversineKm(centerLat!, centerLng!, b.latitude!, b.longitude!),
    );
    const total = rows.length;
    const sliced = rows.slice((page - 1) * pageSize, page * pageSize);
    return {
      items: sliced.map(serialize),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  if (amenityTags.length > 0) {
    const fetched = await prisma.syriaProperty.findMany({
      where,
      orderBy: listingBrowseOrderBy(sort === "distance" ? "featured" : sort),
      take: 1200,
    });
    const filtered = fetched.filter((r) => listingMatchesAmenityTags(r.amenities, amenityTags));
    const total = filtered.length;
    const sliced = filtered.slice((page - 1) * pageSize, page * pageSize);
    return {
      items: sliced.map(serialize),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  const total = await prisma.syriaProperty.count({ where });
  const rows = await prisma.syriaProperty.findMany({
    where,
    orderBy: listingBrowseOrderBy(sort === "distance" ? "featured" : sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: rows.map(serialize),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
