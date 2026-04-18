/**
 * App-level DTOs for Ads Automation V4 — do not expose Prisma types to UI directly.
 */

export type AdsClassification = "winner" | "weak" | "uncertain";

export type RecommendationTypeV4 =
  | "ADS_SCALE_WINNER"
  | "ADS_PAUSE_LOSER"
  | "ADS_TEST_NEW_VARIANT"
  | "LANDING_OPTIMIZATION_RECOMMENDED"
  | "ADS_LOOP_REVIEW"
  | "ADS_GEO_REALLOCATE"
  | "ADS_HOLD_LOW_DATA";

export type PriorityV4 = "LOW" | "MEDIUM" | "HIGH";

export type EvidenceQuality = "LOW" | "MEDIUM" | "HIGH";

export type EvidenceScoreBreakdown = {
  score: number;
  factors: {
    key: string;
    weight: number;
    contribution: number;
    met: boolean;
    detail?: string;
  }[];
};

export type GeoPerformanceSlice = {
  dimension: string;
  label: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  ctr: number;
  conversionRate: number;
};

export type GeoLearningSummary = {
  available: boolean;
  reason?: string;
  slices: GeoPerformanceSlice[];
  topSliceLabel?: string;
};

export type MetricsSnapshot = {
  impressions: number;
  clicks: number;
  leads: number;
  bookingsStarted: number;
  bookingsCompleted: number;
  spend: number | null;
  ctrPercent: number | null;
  cpl: number | null;
  conversionRatePercent: number | null;
};

export type PersistedCampaignClassification = {
  campaignKey: string;
  campaignLabel?: string | null;
  classification: AdsClassification;
  confidence: number;
  evidenceScore: number;
  evidenceQuality: EvidenceQuality;
  reasons: string[];
  warnings: string[];
  missingData: string[];
  metricsSnapshot: MetricsSnapshot;
  geoSummary?: GeoLearningSummary | null;
};

export type PersistedRecommendation = {
  recommendationType: RecommendationTypeV4;
  targetKey?: string | null;
  targetLabel?: string | null;
  priority: PriorityV4;
  confidence: number;
  evidenceScore: number;
  evidenceQuality: EvidenceQuality;
  reasons: string[];
  operatorAction: string;
  expectedOutcome?: string | null;
  metadata?: Record<string, unknown>;
};

export type PersistedLandingInsight = {
  segment?: string | null;
  issueType: string;
  severity?: string | null;
  confidence: number;
  evidenceScore: number;
  views: number;
  clicks: number;
  leads: number;
  bookings: number;
  reasons: string[];
  operatorAction: string;
  recommendedExperiments: string[];
  metricsSnapshot: MetricsSnapshot;
};

export type AdsAutomationLoopRunRecord = {
  id: string;
  windowDays: number;
  aggregateInput: Record<string, unknown>;
  aggregateFunnel: Record<string, unknown>;
  winnersCount: number;
  weakCount: number;
  uncertainCount: number;
  recommendationCount: number;
  confidence: number | null;
  summary: string | null;
  why: string | null;
  featureFlagsSnapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type OperatorExplanationCard = {
  title: string;
  summary: string;
  reliabilityNote: string;
  nextSteps: string[];
};

export type PersistentLearningSnapshot = {
  patterns: Array<{
    patternType: string;
    patternKey: string;
    sentiment: string;
    score: number;
    supportCount: number;
    winCount: number;
    weakCount: number;
    uncertainCount: number;
    lastSeenAt: string | null;
  }>;
  campaignMemories: Array<{
    campaignKey: string;
    campaignLabel: string | null;
    primaryObjective: string | null;
    updatedAt: string;
  }>;
};

export type PersistenceStatus = {
  persisted: boolean;
  loopRunId: string | null;
  warnings: string[];
  learningPersisted: boolean;
};
