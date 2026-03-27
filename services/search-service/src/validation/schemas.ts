import { z } from "zod";
import { parseSort } from "../search/indexer.js";

const listingTypeEnum = z.enum(["MARKETPLACE_SALE", "MARKETPLACE_RENT", "BNHUB"]);

export const searchPropertiesQuerySchema = z.object({
  city: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  propertyType: z.string().max(100).optional(),
  minGuests: z.coerce.number().int().min(1).optional(),
  maxGuests: z.coerce.number().int().min(1).optional(),
  type: listingTypeEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().transform((s) => parseSort(s ?? "newest")).default("newest"),
  q: z.string().max(200).optional(),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().min(1, "q is required").max(100),
  field: z.enum(["city", "propertyType"]).optional().default("city"),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export const mapSearchQuerySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(500).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type SearchPropertiesQuery = z.infer<typeof searchPropertiesQuerySchema>;
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>;
export type MapSearchQuery = z.infer<typeof mapSearchQuerySchema>;
