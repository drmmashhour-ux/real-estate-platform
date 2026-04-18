/**
 * V8 non-destructive ads layer — types only.
 * Does not represent platform truth; shadow / advisory payloads only.
 */

export type V8DiagnosticBucket = "winner_signal" | "loser_signal" | "neutral" | "insufficient_volume";

export type V8CampaignDiagnostic = {
  campaignKey: string;
  bucket: V8DiagnosticBucket;
  /** Human-readable; does not change attribution or stored metrics. */
  notes: string[];
  raw: {
    impressions: number;
    clicks: number;
    leads: number;
    bookingsCompleted: number;
    ctrPercent: number | null;
    cpl: number | null;
    conversionRatePercent: number | null;
  };
};

export type V8AnomalyKind =
  | "ctr_floor"
  | "volume_spike_suspect"
  | "cpl_extreme"
  | "conversion_outlier"
  | "low_sample";

export type V8AnomalySignal = {
  campaignKey: string;
  kind: V8AnomalyKind;
  severity: "info" | "watch" | "review";
  message: string;
};

export type V8ShadowBudgetSafety = {
  manualOnly: true;
  neverAutoApply: true;
  maxAbsPctDelta: number;
  /** Explicit: recommendations are not executed by LECIPM. */
  executionSurface: "ads_manager_manual";
};

export type V8ShadowBidBudgetRecommendation = {
  campaignKey: string;
  /** Hypothetical daily budget delta % (shadow). Null when not applicable. */
  suggestedDailyBudgetDeltaPct: number | null;
  /** Placeholder — network bid not modeled in LECIPM aggregates. */
  suggestedBidDeltaPct: number | null;
  rationale: string[];
  safety: V8ShadowBudgetSafety;
};

export type V8QualityScoreResult = {
  score: number;
  /** 0–100, higher is better; heuristic only. */
  factors: {
    ctrComponent: number;
    conversionComponent: number;
    volumeComponent: number;
  };
};

export type V8AlertLevel = "info" | "watch" | "review";

export type V8AlertCandidate = {
  level: V8AlertLevel;
  scope: "portfolio" | "campaign";
  campaignKey?: string;
  code: string;
  message: string;
};

/** Passive run summary for dashboards / logs — not persisted by this module. */
export type V8NonDestructiveRunStats = {
  campaignsAnalyzed: number;
  insufficientDataCampaignPct: number;
  anomalyCount: number;
  /** Anomalies / campaigns (rough intensity). */
  anomalyRatePerCampaign: number;
  anomalyKindCounts: Partial<Record<V8AnomalyKind, number>>;
  avgQualityScore: number;
  qualityScoreVariance: number;
  shadowRecommendationCount: number;
  shadowRecommendationRatePct: number;
  shadowUpCount: number;
  shadowDownCount: number;
  shadowHoldCount: number;
  alertCount: number;
  /** Observational only — does not change analysis output. */
  observationalWarnings: string[];
};

export type V8NonDestructiveBundle = {
  mode: "v8_non_destructive";
  windowDays: number;
  diagnostics: V8CampaignDiagnostic[];
  anomalies: V8AnomalySignal[];
  shadowBidBudget: V8ShadowBidBudgetRecommendation[];
  qualityByCampaign: Array<{ campaignKey: string } & V8QualityScoreResult>;
  alerts: V8AlertCandidate[];
  disclaimers: string[];
  /** Lightweight monitoring block (same run). */
  monitoring: V8NonDestructiveRunStats;
};
