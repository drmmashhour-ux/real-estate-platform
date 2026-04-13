import { z } from "zod";

export const contentPackStyleSchema = z.enum([
  "price_shock",
  "lifestyle",
  "comparison",
  "question",
  "hidden_gem",
]);

export type ContentPackStyle = z.infer<typeof contentPackStyleSchema>;

export const contentPackItemSchema = z.object({
  style: contentPackStyleSchema,
  valid: z.boolean(),
  invalidReason: z.string(),
  hook: z.string(),
  script: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  overlayText: z.array(z.string()),
  cta: z.string(),
  safetyChecks: z.array(z.string()),
  requiredFieldsUsed: z.array(z.string()),
});

export type ContentPackItem = z.infer<typeof contentPackItemSchema>;

export const structuredContentResponseSchema = z.object({
  contentPacks: z.array(contentPackItemSchema).min(1).max(8),
});

export type StructuredContentResponse = z.infer<typeof structuredContentResponseSchema>;

export type ListingContentInput = {
  title: string;
  city: string;
  region?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  nightPriceCents: number;
  currency: string;
  propertyType: string | null;
  roomType: string | null;
  maxGuests?: number | null;
  amenities: string[];
  imageUrls: string[];
  targetPlatform: "tiktok" | "instagram" | "both";
  brandTone: string;
  /** Short factual description from listing (no invention) */
  descriptionExcerpt?: string | null;
  listingKind: "bnhub" | "other";
};
