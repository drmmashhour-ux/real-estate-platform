/**
 * Broker performance + marketplace ranking V1 — advisory scoring only (no access control side-effects).
 */

/** Legacy summary band (CRM performance card V1). */
export type BrokerPerformanceBand = "low" | "watch" | "good" | "strong";

/**
 * Fair execution tier — engine output (distinct from legacy `BrokerPerformanceBand`).
 * `insufficient_data` = not enough assigned leads for reliable ranking.
 */
export type BrokerExecutionBand = "elite" | "strong" | "healthy" | "weak" | "insufficient_data";

/** Alias matching product naming for “Broker Performance Engine” tiers. */
export type BrokerPerformanceEngineBand = BrokerExecutionBand;

export type BrokerPerformanceConfidence = "high" | "medium" | "low" | "insufficient";

/** Raw + scored execution metrics — all integers bounded where noted; advisory only. */
export type BrokerPerformanceMetrics = {
  brokerId: string;
  leadsAssigned: number;
  leadsContacted: number;
  leadsResponded: number;
  meetingsMarked: number;
  wonDeals: number;
  lostDeals: number;
  /** Heuristic: contacted, no reply signal, idle ≥48h — needs follow-up attention */
  followUpsDue: number;
  /** Leads with `lastFollowUpAt` set (broker logged at least one follow-up touch) */
  followUpsCompleted: number;
  /** Average hours unlock→first contact when pairs exist */
  avgResponseDelayHours?: number;
  activityScore: number;
  conversionScore: number;
  disciplineScore: number;
  overallScore: number;
  confidenceLevel: BrokerPerformanceConfidence;
  executionBand: BrokerExecutionBand;
};

export type BrokerPerformanceInsightSeverity = "info" | "low" | "medium" | "high";

export type BrokerPerformanceInsightType =
  | "strength"
  | "weakness"
  | "neutral"
  | "data_quality"
  | "incentive_hint";

export type BrokerPerformanceInsight = {
  brokerId: string;
  type: BrokerPerformanceInsightType;
  label: string;
  description: string;
  severity: BrokerPerformanceInsightSeverity;
  suggestion?: string;
};

export type BrokerLeaderboardRow = {
  brokerId: string;
  displayName: string;
  overallScore: number;
  band: BrokerExecutionBand;
  keyStrength: string;
  keyWeakness: string;
  confidenceLevel?: BrokerPerformanceConfidence;
};

/** Internal incentive-ready flags — no rewards wired (structure only). */
export type BrokerIncentiveSignals = {
  consecutiveDaysFollowUpDiscipline: number;
  highResponseDiscipline: boolean;
  strongMeetingProgression: boolean;
  steadyCloseRate: boolean;
  denseActivityWeek: boolean;
};

/** Full engine snapshot for APIs (broker personal + admin aggregation). */
export type BrokerPerformanceEngineSnapshot = {
  metrics: BrokerPerformanceMetrics;
  insights: BrokerPerformanceInsight[];
  incentives: BrokerIncentiveSignals;
};

export type BrokerPerformanceBreakdown = {
  responseSpeedScore: number;
  contactRateScore: number;
  engagementScore: number;
  closeSignalScore: number;
  retentionScore: number;
};

export type BrokerPerformanceRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  why: string;
};

export type BrokerPerformanceSummary = {
  brokerId: string;
  overallScore: number;
  band: BrokerPerformanceBand;
  breakdown: BrokerPerformanceBreakdown;
  strongSignals: string[];
  weakSignals: string[];
  recommendations: BrokerPerformanceRecommendation[];
  createdAt: string;
};

export type BrokerMarketplaceRanking = {
  brokerId: string;
  rankScore: number;
  band: BrokerPerformanceBand;
  why: string[];
};

export type BrokerRoutingReadinessSummary = {
  highQualityBrokers: number;
  needsImprovementBrokers: number;
  totalBrokersScored: number;
  routingExperimentsAdvisable: boolean;
  notes: string[];
};
