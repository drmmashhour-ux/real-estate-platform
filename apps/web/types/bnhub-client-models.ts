/**
 * Client-safe BNHub enums and view-model shapes — mirrors Prisma enums/models without importing
 * `@prisma/client` into client bundles.
 */

export type BnhubGrowthAutonomyLevel = "OFF" | "ASSISTED" | "SUPERVISED_AUTOPILOT" | "FULL_AUTOPILOT";

export type BnhubGrowthCampaignObjective =
  | "AWARENESS"
  | "TRAFFIC"
  | "LEADS"
  | "INQUIRIES"
  | "BOOKING_CONVERSION"
  | "HOST_ACQUISITION";

export type BnhubGrowthCampaignType =
  | "LISTING_PROMO"
  | "DESTINATION_PROMO"
  | "SEASONAL"
  | "RETARGETING"
  | "LEAD_GEN"
  | "BOOKING_CONVERSION";

export type BnhubMarketingCampaignObjective =
  | "AWARENESS"
  | "TRAFFIC"
  | "LEAD_GENERATION"
  | "BOOKING_CONVERSION"
  | "BRAND_BUILDING";

export type BnhubMarketingCampaignStatus =
  | "DRAFT"
  | "READY"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED"
  | "FAILED";

/** Fields used by RecommendationCard */
export type BnhubMarketingRecommendation = {
  id: string;
  recommendationType: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  actionLabel: string | null;
};

/** Fields used by {@link MarketingReadinessCard} */
export type BnhubListingMarketingProfile = {
  readinessScore?: number | null;
  missingItemsJson?: unknown;
  recommendedAngle?: string | null;
};

export type BnhubMarketingAsset = {
  id: string;
  content: string;
  assetType: string;
  languageCode: string;
  aiGenerated?: boolean | null;
  humanEdited?: boolean | null;
  title?: string | null;
};

export type BnhubDistributionChannel = {
  id: string;
  code: string;
};

export type BnhubCampaignDistribution = {
  id: string;
  distributionStatus: string;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
  resultSummary?: string | null;
  impressions: number;
  clicks: number;
  bookings: number;
};

export type BnhubDistributionRowView = BnhubCampaignDistribution & {
  channel: BnhubDistributionChannel;
};

/** BNHub listing intelligence row — fields used by AI insight UIs + pricing helpers. */
export type ListingIntelligenceSnapshotView = {
  aiCompositeScore?: number | null;
  relevanceScore?: number | null;
  demandScore?: number | null;
  conversionScore?: number | null;
  priceCompetitiveness?: number | null;
  qualityScore?: number | null;
  personalizationScore?: number | null;
  confidenceScore?: number | null;
};
