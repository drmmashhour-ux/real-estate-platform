import { z } from "zod";

export const listingQualitySchema = z.object({
  listingId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  reviews: z.array(z.object({ rating: z.number(), text: z.string().optional() })).optional(),
  photoCount: z.number().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export const pricingSuggestionSchema = z.object({
  listingId: z.string().optional(),
  location: z.string().min(1),
  season: z.string().optional(),
  demandLevel: z.enum(["low", "medium", "high"]).optional(),
  similarListings: z.array(z.object({ nightPriceCents: z.number() })).optional(),
  reviewCount: z.number().optional(),
  avgRating: z.number().optional(),
  currentPriceCents: z.number().optional(),
});

export const riskCheckSchema = z.object({
  bookingId: z.string().optional(),
  userId: z.string().optional(),
  signals: z.array(z.object({ type: z.string(), score: z.number().min(0).max(1) })).optional(),
  paymentAttempts: z.number().optional(),
  accountAgeDays: z.number().optional(),
});

export const demandForecastSchema = z.object({
  region: z.string().min(1),
  propertyType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  searchVolumeTrend: z.enum(["up", "down", "stable"]).optional(),
  bookingHistoryCount: z.number().optional(),
});

export const hostInsightsSchema = z.object({
  hostId: z.string().min(1),
  listingIds: z.array(z.string()).optional(),
  periodDays: z.number().optional(),
});

export const supportAssistantSchema = z.object({
  action: z.enum(["summarize_dispute", "suggest_reply", "answer_question"]),
  disputeId: z.string().optional(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  question: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});
