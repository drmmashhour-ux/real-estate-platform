import { z } from "zod";

export const propertyCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(20000),
  price: z.coerce.number().positive().max(1_000_000_000),
  city: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  propertyType: z.enum([
    "HOUSE",
    "CONDO",
    "TOWNHOUSE",
    "MULTI_FAMILY",
    "LAND",
    "COMMERCIAL",
    "OTHER",
  ]),
  bedrooms: z.coerce.number().int().min(0).max(50),
  bathrooms: z.coerce.number().min(0).max(50),
  areaSqm: z.coerce.number().positive().max(1_000_000).optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PENDING", "SOLD", "ARCHIVED"])
    .optional(),
  brokerId: z.string().uuid().optional().nullable(),
});

export const propertyFilterSchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z
    .enum([
      "HOUSE",
      "CONDO",
      "TOWNHOUSE",
      "MULTI_FAMILY",
      "LAND",
      "COMMERCIAL",
      "OTHER",
    ])
    .optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PENDING", "SOLD", "ARCHIVED"]).optional(),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
