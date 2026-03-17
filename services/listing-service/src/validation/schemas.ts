import { z } from "zod";

const listingTypeEnum = z.enum(["MARKETPLACE_SALE", "MARKETPLACE_RENT", "BNHUB"]);
const listingStatusEnum = z.enum(["DRAFT", "PENDING_REVIEW", "LIVE", "SUSPENDED", "ARCHIVED"]);

const optionalString = z.string().optional().nullable().transform((s) => s?.trim() || null);
const urlSchema = z.string().url().max(2048);
const countrySchema = z.string().length(2).optional().default("CA");
const currencySchema = z.string().length(3).optional().default("CAD");

export const createPropertyBodySchema = z.object({
  type: listingTypeEnum,
  title: z.string().min(1, "title is required").max(500),
  description: optionalString,
  propertyType: z.string().max(100).optional().nullable(),
  address: z.string().min(1, "address is required").max(500),
  city: z.string().min(1, "city is required").max(100),
  region: z.string().max(100).optional().nullable(),
  country: countrySchema,
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  priceCents: z.number().int().min(0).optional().nullable(),
  currency: currencySchema,
  nightlyPriceCents: z.number().int().min(0).optional().nullable(),
  cleaningFeeCents: z.number().int().min(0).optional().nullable(),
  maxGuests: z.number().int().min(1).optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  beds: z.number().int().min(0).optional().nullable(),
  baths: z.number().min(0).optional().nullable(),
  checkInTime: z.string().max(10).optional().nullable(),
  checkOutTime: z.string().max(10).optional().nullable(),
  houseRules: z.string().max(2000).optional().nullable(),
  minNights: z.number().int().min(1).optional().nullable(),
  maxNights: z.number().int().min(1).optional().nullable(),
  registrationNumber: z.string().max(100).optional().nullable(),
  images: z.array(z.object({ url: urlSchema, sortOrder: z.number().int().min(0).optional() })).optional().default([]),
  amenities: z.array(z.string().min(1).max(100)).optional().default([]),
});

export const updatePropertyBodySchema = createPropertyBodySchema.partial().extend({
  status: listingStatusEnum.optional(),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export const listPropertiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  ownerId: z.string().uuid().optional(),
  status: listingStatusEnum.optional(),
  type: listingTypeEnum.optional(),
  city: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
});

export type CreatePropertyBody = z.infer<typeof createPropertyBodySchema>;
export type UpdatePropertyBody = z.infer<typeof updatePropertyBodySchema>;
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuerySchema>;
