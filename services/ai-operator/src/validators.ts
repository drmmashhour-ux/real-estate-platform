import { z } from "zod";

export const listingAnalyzeSchema = z.object({
  listingId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  photoCount: z.number().optional(),
  photoUrls: z.array(z.string()).optional(),
  houseRules: z.string().optional(),
  nightPriceCents: z.number().optional(),
  cleaningFeeCents: z.number().optional(),
});

export const pricingRecommendSchema = z.object({
  listingId: z.string().optional(),
  location: z.string().min(1),
  season: z.string().optional(),
  demandLevel: z.enum(["low", "medium", "high"]).optional(),
  nearbyPricesCents: z.array(z.number()).optional(),
  occupancyTrend: z.number().optional(),
  listingQualityScore: z.number().optional(),
  reviewCount: z.number().optional(),
  avgRating: z.number().optional(),
  currentPriceCents: z.number().optional(),
});

export const fraudEvaluateSchema = z.object({
  bookingId: z.string().optional(),
  userId: z.string().optional(),
  signals: z.array(z.object({ type: z.string(), score: z.number().min(0).max(1) })).optional(),
  paymentAttemptCount: z.number().optional(),
  cancellationRate: z.number().optional(),
  accountAgeDays: z.number().optional(),
});

export const bookingCheckSchema = z.object({
  bookingId: z.string().optional(),
  guestId: z.string().optional(),
  hostId: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  nights: z.number().optional(),
  cancellationHistoryCount: z.number().optional(),
  overlapAttempts: z.number().optional(),
});

export const demandForecastSchema = z.object({
  market: z.string().min(1),
  propertyType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  searchVolumeTrend: z.enum(["up", "down", "stable"]).optional(),
  bookingFrequency: z.number().optional(),
});

export const hostAnalyzeSchema = z.object({
  hostId: z.string().min(1),
  responseTimeHours: z.number().optional(),
  avgRating: z.number().optional(),
  ratingTrend: z.enum(["up", "down", "stable"]).optional(),
  cancellationRate: z.number().optional(),
  complaintCount: z.number().optional(),
  listingCompletenessPct: z.number().optional(),
  acceptanceRate: z.number().optional(),
});

export const supportTriageSchema = z.object({
  ticketId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export const marketplaceHealthSchema = z.object({
  periodDays: z.number().optional(),
  bookingsTrend: z.enum(["up", "down", "stable"]).optional(),
  cancellationsTrend: z.enum(["up", "down", "stable"]).optional(),
  fraudAlertVolume: z.number().optional(),
  disputeVolume: z.number().optional(),
  listingActivationRate: z.number().optional(),
  supportTicketSpike: z.boolean().optional(),
  paymentFailureSpike: z.boolean().optional(),
});

export const humanOverrideSchema = z.object({
  overrideBy: z.string().min(1),
  newAction: z.string().min(1),
  notes: z.string().optional(),
});
