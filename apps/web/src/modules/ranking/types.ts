import type { RankingListingType } from "@/src/modules/ranking/dataMap";

export type RankingPageType =
  | "search"
  | "home"
  | "city_page"
  | "map"
  | "recommendations"
  | "browse"
  | "admin";

export type RankingSearchContext = {
  listingType: RankingListingType;
  /** Click / impression row (optional) */
  position?: number;
  city?: string;
  neighborhood?: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  propertyType?: string;
  roomType?: string;
  pageType?: RankingPageType;
  userId?: string | null;
  sessionId?: string | null;
  /** After availability filter: listing is bookable for requested dates */
  availableForDates?: boolean;
  /** Optional override: `ranking_configs.config_key` when multi-city profile supplies it */
  rankingConfigKey?: string | null;
};

/** Normalized 0–1 signals used by scoringEngine */
export type RankingSignalBundle = {
  relevance: number;
  trust: number;
  quality: number;
  engagement: number;
  conversion: number;
  freshness: number;
  host: number;
  review: number;
  priceCompetitiveness: number;
  availability: number;
};

export type RankingExplanation = {
  topPositive: string[];
  topNegative: string[];
  missingData: string[];
  boosts: string[];
  caps: string[];
};

export type RankingScoreResult = {
  listingType: RankingListingType;
  listingId: string;
  city: string | null;
  neighborhood: string | null;
  totalScore: number;
  relevanceScore: number;
  trustScore: number;
  qualityScore: number;
  engagementScore: number;
  conversionScore: number;
  freshnessScore: number;
  hostScore: number | null;
  reviewScore: number | null;
  priceCompetitivenessScore: number | null;
  availabilityScore: number | null;
  signals: RankingSignalBundle;
  weightsUsed: Record<string, number>;
  explanation?: RankingExplanation;
};

export type BnhubListingRankingInput = {
  id: string;
  city: string;
  region: string | null;
  nightPriceCents: number;
  maxGuests: number;
  propertyType: string | null;
  roomType: string | null;
  amenities: unknown;
  photos: unknown;
  description: string | null;
  verificationStatus: string;
  listingVerificationStatus: string;
  listingStatus: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  instantBookEnabled: boolean;
  houseRules: string | null;
  checkInInstructions: string | null;
  photoCount: number;
  reviewAvg: number | null;
  reviewCount: number;
  completedBookings: number;
  disputeCount: number;
  favoriteCount: number;
  aggregateAvgRating: number | null;
  aggregateTotalReviews: number;
  hostPerformanceScore: number | null;
  hostHasFastResponder: boolean;
  hostHasReliable: boolean;
  medianNightPriceCents: number | null;
  /** Monthly top-host program — added to review signal (capped in engine). */
  reputationRankBoost: number;
  /** 0–1 platform trust layer (`platform_trust_scores`) — modest ranking blend */
  platformListingTrust01?: number | null;
  platformHostTrust01?: number | null;
};

export type FsboListingRankingInput = {
  id: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  description: string;
  propertyType: string | null;
  status: string;
  moderationStatus: string;
  trustScore: number | null;
  riskScore: number | null;
  verificationStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  featuredUntil: Date | null;
  viewCount: number;
  saveCount: number;
  leadCount: number;
  /** Cached demand score (0–100) from `ListingAnalytics` when available. */
  demandScoreFromAnalytics?: number | null;
  medianPriceCents: number | null;
};

export type CrmListingRankingInput = {
  id: string;
  title: string;
  price: unknown;
  createdAt: Date;
  medianPriceCents: number | null;
};
