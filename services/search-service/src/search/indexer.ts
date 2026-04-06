import type { Property, PropertyImage, PropertyAmenity } from "../generated/prisma/index.js";

/**
 * Search document shape used for indexing and querying.
 * Can be sent to a full-text search engine (e.g. Elasticsearch) when scaling.
 * For now we query PostgreSQL directly; this module normalizes property data for search.
 */
export interface SearchDocument {
  id: string;
  ownerId: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  propertyType: string | null;
  address: string;
  city: string;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  priceCents: number | null;
  currency: string;
  nightlyPriceCents: number | null;
  maxGuests: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  amenities: string[];
  imageUrls: string[];
  createdAt: string;
}

export type PropertyWithRelations = Property & {
  images: PropertyImage[];
  amenities: PropertyAmenity[];
};

/**
 * Build a search document from a property (for indexing or API response).
 * Use when syncing to Elasticsearch/OpenSearch or for consistent response shape.
 */
export function buildSearchDocument(property: PropertyWithRelations): SearchDocument {
  return {
    id: property.id,
    ownerId: property.ownerId,
    type: property.type,
    status: property.status,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    address: property.address,
    city: property.city,
    region: property.region,
    country: property.country,
    latitude: property.latitude,
    longitude: property.longitude,
    priceCents: property.priceCents,
    currency: property.currency,
    nightlyPriceCents: property.nightlyPriceCents,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    beds: property.beds,
    baths: property.baths,
    amenities: property.amenities.map((a) => a.amenityKey).sort(),
    imageUrls: property.images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url),
    createdAt: property.createdAt.toISOString(),
  };
}

/** Default sort options for property search */
export const SORT_OPTIONS = [
  "price_asc",
  "price_desc",
  "newest",
  "oldest",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export function parseSort(sort: string): SortOption {
  if (SORT_OPTIONS.includes(sort as SortOption)) return sort as SortOption;
  return "newest";
}
