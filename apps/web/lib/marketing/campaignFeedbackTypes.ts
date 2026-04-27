/**
 * Order 88 — auto-feedback from simulated broker campaign performance (types only; safe for any layer).
 */
export type AdPlatform = "tiktok" | "meta" | "google";

export const CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS = 3;

export type CampaignFeedbackInsights = {
  bestPlatform: AdPlatform | null;
  bestAudience: "buyer" | "seller" | "host" | "broker" | null;
  bestCity: string | null;
  /** Average CTR across all analyzed campaigns with performance. */
  avgCtr: number;
  /** Average click→conversion rate across analyzed campaigns. */
  avgConversionRate: number;
  recommendation: string;
  /** Campaigns with at least one performance row. */
  campaignsAnalyzed: number;
  /** True when `campaignsAnalyzed >= CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS` — only then may generation use feedback. */
  eligible: boolean;
};
