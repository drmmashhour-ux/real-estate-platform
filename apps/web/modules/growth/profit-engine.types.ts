export type ProfitTrendLabel = "improving" | "declining" | "unstable" | "insufficient_data";

export type CampaignProfitMetrics = {
  campaignId: string;

  cpl: number | null;
  avgLTV: number | null;

  ltvToCplRatio: number | null;
  profitPerLead: number | null;

  profitabilityStatus: "PROFITABLE" | "BREAKEVEN" | "UNPROFITABLE" | "INSUFFICIENT_DATA";

  /** Legacy combined confidence (kept for callers); prefer `confidenceScore` when present. */
  confidence: number;
  /** V2: volume- and data-aware score in [0,1]. */
  confidenceScore?: number;
  evidenceQuality?: "LOW" | "MEDIUM" | "HIGH";
  /**
   * Learning bucket for persistence + unified learning (ratio > 1.2 / &lt; 0.8).
   * Distinct from `profitabilityStatus` display bands.
   */
  profitLearningSignal?: "PROFITABLE" | "UNPROFITABLE" | null;

  /** Optional trend label when FEATURE_PROFIT_ENGINE_TRENDS_V1 is on. */
  profitTrend?: ProfitTrendLabel;

  /** Lead count in window (safety + explainability; no profit math when under 3). */
  sampleLeads?: number;
  sampleBookings?: number;
};

export type ProfitRecommendation = {
  campaignId: string;
  action: "SCALE" | "PAUSE" | "FIX_FUNNEL" | "MONITOR";
  reason: string;
  confidence: number;
  /** Optional Brain V3 explainability hook (never changes action alone). */
  crossDomainHint?: string;
};
