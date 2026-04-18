/**
 * AI Control Center — read-only executive payload types.
 */

export type ControlCenterUnifiedStatus =
  | "healthy"
  | "limited"
  | "warning"
  | "critical"
  | "disabled"
  | "unavailable";

export type ExecutiveOverallStatus = "healthy" | "limited" | "warning" | "critical";

export type AiControlCenterBrainSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  shadowObservationEnabled: boolean;
  influenceEnabled: boolean;
  primaryEnabled: boolean;
  fallbackRatePct: number | null;
  warningCount: number;
  comparisonRuns: number | null;
  avgOverlapRate: number | null;
  lastReportAt: string | null;
  topIssue: string | null;
  topRecommendation: string | null;
  detailsHref: string | null;
};

export type AiControlCenterAdsSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  shadowMode: boolean;
  v8Rollout: boolean;
  influenceEnabled: boolean;
  primaryEnabled: boolean;
  comparisonRuns: number | null;
  avgOverlapRate: number | null;
  avgDivergenceRate: number | null;
  pctRunsRisky: number | null;
  anomalyNote: string | null;
  topRecommendation: string | null;
  detailsHref: string | null;
};

export type AiControlCenterCroSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  analysisEnabled: boolean;
  healthScore: number | null;
  topBottleneck: string | null;
  dropoffSummary: string | null;
  recommendationCount: number | null;
  readinessNote: string | null;
  warningSummary: string | null;
  detailsHref: string | null;
};

export type AiControlCenterRankingSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  totalScore: number | null;
  maxScore: number | null;
  recommendation: string | null;
  readinessGatesOk: number | null;
  readinessGatesTotal: number | null;
  rollbackAny: boolean;
  top5Overlap: number | null;
  avgRankShift: number | null;
  warningsCount: number | null;
  detailsHref: string | null;
};

export type AiControlCenterOperatorSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  executionPlanFlag: boolean;
  simulationFlag: boolean;
  conflictEngineFlag: boolean;
  priorityScoringFlag: boolean;
  planCount: number | null;
  conflictCount: number | null;
  topRecommendation: string | null;
  detailsHref: string | null;
};

export type AiControlCenterPlatformCoreSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  priorityEnabled: boolean;
  dependenciesEnabled: boolean;
  schedulerEnabled: boolean;
  simulationEnabled: boolean;
  pendingDecisions: number | null;
  blockedDecisions: number | null;
  overdueSchedules: number | null;
  blockedDependencyEdges: number | null;
  healthWarnings: string[];
  detailsHref: string | null;
};

export type AiControlCenterFusionSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  orchestrationActive: boolean;
  influenceEnabled: boolean;
  primaryEnabled: boolean;
  agreementHint: string | null;
  conflictCount: number | null;
  recommendationCount: number | null;
  healthNote: string | null;
  topRecommendation: string | null;
  detailsHref: string | null;
};

export type AiControlCenterGrowthLoopSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  systemEnabled: boolean;
  executionEnabled: boolean;
  simulationEnabled: boolean;
  lastRunStatus: string | null;
  lastRunAt: string | null;
  actionsProposed: number | null;
  actionsExecuted: number | null;
  notes: string | null;
  detailsHref: string | null;
};

export type AiControlCenterSwarmSummary = {
  status: ControlCenterUnifiedStatus;
  summary: string;
  enabled: boolean;
  negotiationEnabled: boolean;
  influenceEnabled: boolean;
  primaryEnabled: boolean;
  agentSlots: number;
  conflictCount: number | null;
  humanReviewCount: number | null;
  topOpportunity: string | null;
  negotiationNote: string | null;
  detailsHref: string | null;
};

export type AiControlCenterSystems = {
  brain: AiControlCenterBrainSummary;
  ads: AiControlCenterAdsSummary;
  cro: AiControlCenterCroSummary;
  ranking: AiControlCenterRankingSummary;
  operator: AiControlCenterOperatorSummary;
  platformCore: AiControlCenterPlatformCoreSummary;
  fusion: AiControlCenterFusionSummary;
  growthLoop: AiControlCenterGrowthLoopSummary;
  swarm: AiControlCenterSwarmSummary;
};

export type AiControlCenterExecutiveSummary = {
  overallStatus: ExecutiveOverallStatus;
  criticalWarnings: string[];
  topOpportunities: string[];
  topRisks: string[];
  systemsHealthyCount: number;
  systemsWarningCount: number;
  systemsCriticalCount: number;
};

export type AiControlCenterRolloutSummary = {
  primarySystems: string[];
  shadowSystems: string[];
  influenceSystems: string[];
  blockedSystems: string[];
};

export type AiControlCenterHistoryRow = {
  ts: string;
  system: string;
  event: string;
  note: string;
};

export type AiControlCenterPayload = {
  systems: AiControlCenterSystems;
  executiveSummary: AiControlCenterExecutiveSummary;
  rolloutSummary: AiControlCenterRolloutSummary;
  unifiedWarnings: string[];
  history: AiControlCenterHistoryRow[];
  meta: {
    dataFreshnessMs: number;
    sourcesUsed: string[];
    missingSources: string[];
    systemsLoadedCount: number;
  };
};

export type LoadAiControlCenterParams = {
  days?: number;
  limit?: number;
  offsetDays?: number;
};
