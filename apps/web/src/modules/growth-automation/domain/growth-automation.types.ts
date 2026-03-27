import type { GrowthContentItemStatus, GrowthMarketingPlatform } from "@prisma/client";

export type { GrowthContentItemStatus, GrowthMarketingPlatform };

/** Initial content families (LECIPM marketing). */
export type ContentFamily =
  | "mistake_prevention"
  | "deal_education"
  | "legal_negotiation_explainer"
  | "product_demo"
  | "comparison"
  | "case_story";

export type SafeMarketingChannel = {
  id: string;
  platform: GrowthMarketingPlatform;
  externalAccountId: string;
  displayName: string;
  scopes: unknown;
  tokenExpiresAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyContentPlan = {
  planDate: string;
  mainTopic: string;
  contentAngle: string;
  targetPlatforms: GrowthMarketingPlatform[];
  cta: string;
  linkedProductOrFeature: string;
  linkedUrl?: string;
  slots: Array<{
    platform: GrowthMarketingPlatform;
    hook: string;
    contentFamily: ContentFamily;
    taxonomyPillar: import("@/src/modules/growth-automation/domain/contentTaxonomy").ContentPillar;
    hookPattern: import("@/src/modules/growth-automation/domain/hookPatterns").HookPattern;
  }>;
};

export type WeeklyCampaignPlan = {
  weekStart: string;
  theme: string;
  days: Array<{
    date: string;
    mainTopic: string;
    angle: string;
    platforms: GrowthMarketingPlatform[];
  }>;
};

export type StructuredContent = {
  hook: string;
  body: string;
  cta: string;
  sourceProductOrFeature: string;
  channelNotes?: string;
};

export type DraftPayload = StructuredContent & {
  format?: string;
  hashtags?: string[];
  title?: string;
  thumbnailCopy?: string;
  metadata?: Record<string, unknown>;
};

export type PublishContext = {
  itemId: string;
  platform: GrowthMarketingPlatform;
  draft: DraftPayload;
  marketingChannelId: string | null;
};

export type AdapterResult =
  | { ok: true; externalPostId: string; raw?: unknown }
  | { ok: false; code: string; message: string };

export type PerformanceRow = {
  contentItemId: string;
  platform: GrowthMarketingPlatform;
  metricDate: string;
  views: number;
  impressions?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  clicks?: number | null;
  conversions?: number | null;
};

export type OptimizationBundle = {
  hooks: string[];
  postingTimesHint: Record<string, string>;
  topicMix: string[];
  ctas: string[];
  /** Pillar balance suggestions from recent performance + taxonomy targets. */
  taxonomyMix?: string[];
  topHooks?: string[];
  topPlatforms?: string[];
  topTopics?: string[];
};
