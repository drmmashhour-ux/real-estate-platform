/** LECIPM Marketing Hub — types */

import type { VideoProjectRowVm } from "@/modules/video-engine/video-engine.types";

export type MarketingContentType =
  | "listing_highlight"
  | "top_5_listings"
  | "deal_of_the_day"
  | "luxury_spotlight"
  | "new_this_week"
  | "bnhub_stay"
  | "investor_deal"
  | "residence_spotlight"
  | "video_reel";

export type MarketingSocialPlatform = "instagram" | "tiktok" | "linkedin";

export type MarketingPostStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "published"
  | "export_queue"
  | "failed"
  | "cancelled";

export type MarketingGeneratedContentVm = {
  contentType: MarketingContentType;
  sourceKind: "crm_listing" | "fsbo_listing" | "bnhub_listing" | "investor_deal" | "residence" | "aggregate";
  sourceId: string | null;
  title: string;
  caption: string;
  hashtags: string[];
  mediaRefs: string[];
  suggestedPlatform: MarketingSocialPlatform;
  /** Finance / securities guardrails */
  complianceNote?: string | null;
};

export type MarketingHubDashboardVm = {
  queue: MarketingPostRowVm[];
  generatedReady: MarketingPostRowVm[];
  performance: MarketingPerformanceSummaryVm;
  strategyInsights: string[];
  growthLinkedDrafts: number;
  /** Video Content Engine — awaiting review (preview). */
  videoReviewQueue: VideoProjectRowVm[];
  /** Scheduled short-form packages. */
  videoScheduled: VideoProjectRowVm[];
  /** Published reels with rough engagement signals when synced. */
  videoTopPerforming: VideoProjectRowVm[];
};

export type MarketingPostRowVm = {
  id: string;
  contentType: string;
  title: string;
  caption: string;
  hashtags: string[];
  status: string;
  suggestedPlatform: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  manualExport: boolean;
  growthSignalRef: string | null;
  performance: Record<string, unknown> | null;
};

export type MarketingPerformanceSummaryVm = {
  postsTracked: number;
  totalImpressionsApprox: number;
  totalClicksApprox: number;
  leadsAttributedApprox: number;
  bookingsAttributedApprox: number;
  bestPostId: string | null;
};

export type MarketingMobileSummaryVm = {
  todayPosts: MarketingPostRowVm[];
  performance: MarketingPerformanceSummaryVm;
  alerts: string[];
};
