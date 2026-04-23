import type {
  ContentAudience,
  ContentGoal,
  ContentPlatform,
  ContentType,
} from "@/modules/marketing-content/content-calendar.types";

export type MarketingAutonomyLevel = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";

export type PostingTimeSlot = "morning" | "evening";

export type GeneratedMarketingPack = {
  hook: string;
  script: string;
  caption: string;
  cta: string;
};

export type PlannedSlot = {
  id: string;
  /** 0 = Monday … 6 = Sunday when weekStartsOn Monday */
  dayOffset: number;
  platform: ContentPlatform;
  contentType: ContentType;
  audience: ContentAudience;
  goal: ContentGoal;
  suggestedSlot: PostingTimeSlot;
  topic: string;
  generated?: GeneratedMarketingPack;
};

export type WeeklyPlan = {
  weekStartIso: string;
  slots: PlannedSlot[];
  generatedAtIso: string;
  plannerVersion: string;
};

export type QueueItemStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type QueueItem = {
  id: string;
  planSlotId?: string;
  /** Linked calendar row once materialized */
  contentItemId?: string;
  title: string;
  previewHook: string;
  platform: ContentPlatform;
  contentType: ContentType;
  audience: ContentAudience;
  goal: ContentGoal;
  scheduledDayIso?: string;
  suggestedSlot: PostingTimeSlot;
  pack: GeneratedMarketingPack;
  status: QueueItemStatus;
  autonomySnapshot: MarketingAutonomyLevel;
  createdAtIso: string;
  decidedAtIso?: string;
  decisionNote?: string;
};

export type ApprovalLogEntry = {
  id: string;
  queueItemId: string;
  decision: "APPROVED" | "REJECTED";
  atIso: string;
  note?: string;
};

export type LearningState = {
  /** Aggregated engagement-weighted scores by dimension */
  platformScores: Partial<Record<ContentPlatform, number>>;
  typeScores: Partial<Record<ContentType, number>>;
  audienceScores: Partial<Record<ContentAudience, number>>;
  slotScores: Partial<Record<PostingTimeSlot, number>>;
  /** Normalized hook template keys -> rolling score */
  hookTemplateScores: Record<string, number>;
  samples: number;
  updatedAtIso: string;
};

export type PerformanceInsights = {
  bestPlatforms: ContentPlatform[];
  worstPlatforms: ContentPlatform[];
  bestAudiences: ContentAudience[];
  bestTypes: ContentType[];
  weakTypes: ContentType[];
  avgLeadsPerPosted: number;
  avgRevenuePerPostedCents: number;
};

export type PlannerWeights = {
  platform: Partial<Record<ContentPlatform, number>>;
  audience: Partial<Record<ContentAudience, number>>;
  type: Partial<Record<ContentType, number>>;
  slot: Partial<Record<PostingTimeSlot, number>>;
};

export type MarketingAiAlertKind =
  | "no_content_scheduled"
  | "high_performer"
  | "low_engagement_trend";

export type MarketingAiAlert = {
  id: string;
  kind: MarketingAiAlertKind;
  title: string;
  body: string;
  relatedContentId?: string;
  createdAtIso: string;
};
