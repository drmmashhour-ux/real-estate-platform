import { z } from "zod";

export const listingAnalysisSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  location: z.object({ city: z.string().optional(), address: z.string().optional() }).optional(),
  photos: z.array(z.string()).optional(),
});

export const pricingSchema = z.object({
  location: z.string().min(1),
  propertyType: z.string().optional(),
  season: z.string().optional(),
  demandLevel: z.enum(["low", "medium", "high"]).optional(),
  listingRating: z.number().min(0).max(5).optional(),
  nearbyListingPrices: z.array(z.number()).optional(),
});

export const demandSchema = z.object({
  region: z.string().min(1),
  propertyType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const fraudCheckSchema = z.object({
  bookingId: z.string().optional(),
  userId: z.string().optional(),
  signals: z.array(z.object({ type: z.string(), score: z.number().min(0).max(1) })).optional(),
});

export const supportSchema = z.object({
  type: z.enum(["host_question", "guest_question", "dispute_summary", "suggest_response"]),
  message: z.string().optional(),
  conversation: z.array(z.object({ role: z.enum(["user", "agent"]), content: z.string() })).optional(),
  disputeId: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});
