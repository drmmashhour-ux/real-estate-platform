/**
 * Shared AI domain types — one normalized contract for search, pricing, autopilot, recommendations.
 */

/** Mirrors BNHub stays search filters (shared with search ranking). */
export type AiSearchFilters = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  propertyType?: string;
  amenitySlugs?: string[];
};

export type IntelligenceDomain = "search" | "pricing" | "autopilot" | "recommendation";

export type ListingQualityFlags = {
  lowPhotoCount: boolean;
  weakDescription: boolean;
  weakTitle: boolean;
  missingAmenities: boolean;
};

/** Normalized listing signals — input to `computeCompositeScore` for all domains. */
export type ListingSignals = {
  listingId: string;
  city: string;
  region: string | null;
  propertyType: string | null;
  roomType: string | null;
  currentPrice: number;
  /** Nightly price in major units (e.g. CAD). */
  nightPriceCents: number;
  maxGuests: number;
  avgAreaNightPrice: number | null;
  demandScore: number;
  demandScoreRaw: number;
  conversionRate: number;
  ctr: number;
  occupancyRate: number;
  bookingVelocity: number;
  views7d: number;
  views30d: number;
  bookings7d: number;
  bookings30d: number;
  photoCount: number;
  reviewAvg: number | null;
  reviewCount: number;
  hasActivePromotion: boolean;
  competitionCount: number;
  createdAt: Date;
  qualityFlags: ListingQualityFlags;
};

export type UserSignals = {
  userId: string;
  preferredCities: string[];
  preferredTypes: string[];
  preferredPriceMin: number | null;
  preferredPriceMax: number | null;
  preferredGuests: number | null;
  preferredAmenities: string[];
  engagementScore: number;
  bookingIntentScore: number;
  luxuryPreferenceScore: number;
};

/** Per-dimension scores 0–1 unless noted. */
export type IntelligenceScores = {
  relevanceScore: number;
  demandScore: number;
  conversionScore: number;
  priceCompetitiveness: number;
  qualityScore: number;
  personalizationScore: number;
  recencyScore: number;
  confidenceScore: number;
};

export type CompositeScoreResult = {
  scores: IntelligenceScores;
  aiCompositeScore: number;
  explanation: string;
  confidenceScore: number;
  trendLabel: string | null;
};

export type PriceSuggestionResult = {
  currentPrice: number;
  suggestedPrice: number;
  deltaPct: number;
  confidenceScore: number;
  reasonSummary: string;
  intelligenceScores: IntelligenceScores;
  compositeExplanation: string;
};

export type AutopilotEvaluationResult = {
  listingId: string;
  intelligence: IntelligenceScores;
  explanation: string;
  confidenceScore: number;
  qualityFlags: ListingQualityFlags;
};

export type RecommendationResult = {
  listingId: string;
  aiCompositeScore: number;
  explanation: string;
  intelligence: IntelligenceScores;
};

/** Optional search context when ranking (guest search filters). */
export type SearchContext = {
  filters: AiSearchFilters;
};
