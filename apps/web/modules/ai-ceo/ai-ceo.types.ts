/** AI CEO Mode — strategic advisory layer (no blind execution). */

export type AiCeoCategory = "growth" | "cost" | "risk" | "expansion";

/** Banded expectation — never guaranteed ROI. */
export type AiCeoImpactBand = "low" | "moderate" | "meaningful" | "uncertain_thin_data";

export type AiCeoUrgency = "low" | "medium" | "high" | "critical";

export type AiCeoEffort = "low" | "medium" | "high";

export type AiCeoExecutionSafety = "NEVER_AUTO" | "APPROVAL_REQUIRED" | "ADVISORY_ONLY";

export type AiCeoPrioritizationBucket =
  | "TOP_PRIORITY"
  | "QUICK_WIN"
  | "HIGH_RISK_HIGH_REWARD"
  | "LOW_VALUE";

export type AiCeoDecisionStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed";

/** Lightweight cross-platform snapshot used as model input (no PII blobs). */
export type AiCeoPlatformContext = {
  generatedAt: string;
  executive?: {
    financialHints?: Record<string, unknown>;
    platformHints?: Record<string, unknown>;
    riskLevel?: string | null;
    snapshotAgeHours?: number | null;
  };
  revenue?: {
    note?: string | null;
    conversionProxy?: number | null;
  };
  deals?: {
    activeCount?: number | null;
    stalledCount?: number | null;
    statusDistribution?: Array<{ status: string; count: number }>;
  };
  bookings?: {
    bookingsToday?: number | null;
    bookingWindowNote?: string | null;
  };
  autonomy?: {
    autopilotExecutions7d?: number | null;
    blockRate?: number | null;
    approvalQueueDepth?: number | null;
  };
  marketing?: {
    campaignsTouchedMtd?: number | null;
    seoDraftInventory?: number | null;
  };
  capital?: {
    note?: string | null;
  };
  marketplace?: {
    note?: string | null;
  };
  learning?: {
    outcomeLinked7d?: number | null;
    note?: string | null;
  };
  coverage?: {
    thinDataWarnings: string[];
  };
};

export type AiCeoSignalRef = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
};

export type AiCeoExplanation = {
  dataTriggers: string[];
  signalsContributing: AiCeoSignalRef[];
  whyItMatters: string;
  ifIgnored: string;
  dataBasisNote: string;
  confidenceRationale: string;
};

export type AiCeoRecommendationDraft = {
  fingerprint: string;
  title: string;
  category: AiCeoCategory;
  summary: string;
  expectedImpactBand: AiCeoImpactBand;
  confidenceScore: number;
  urgency: AiCeoUrgency;
  requiredEffort: AiCeoEffort;
  affectedDomains: string[];
  executionSafety: AiCeoExecutionSafety;
  signalsUsed: AiCeoSignalRef[];
  explanation: AiCeoExplanation;
  /** Subset of context serialized for audit */
  inputSnapshot: Record<string, unknown>;
  prioritizationBucket?: AiCeoPrioritizationBucket;
};

export type AiCeoPrioritizedSet = {
  topPriorities: AiCeoRecommendationDraft[];
  quickWins: AiCeoRecommendationDraft[];
  highRiskHighReward: AiCeoRecommendationDraft[];
  lowValue: AiCeoRecommendationDraft[];
};

export type AiCeoMeasurementSummary = {
  recommendationCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  completedCount: number;
  /** Approximate share of completed with positive outcome band */
  successRateProxy: number | null;
  /** Average confidence of completed items */
  avgConfidenceCompleted: number | null;
  falsePositiveReports: number;
  ignoredStalePending: number;
};
