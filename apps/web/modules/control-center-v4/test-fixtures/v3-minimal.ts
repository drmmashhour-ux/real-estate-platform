import type {
  CommandCenterRole,
  CommandCenterRoleView,
  CompanyCommandCenterV3Payload,
} from "@/modules/control-center-v3/company-command-center-v3.types";

function emptyRole(role: CommandCenterRole): CommandCenterRoleView {
  return {
    role,
    heroSummary: "",
    topPriorities: [],
    topRisks: [],
    topBlockers: [],
    recommendedFocusAreas: [],
    systems: { highlights: [] },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    warnings: [],
  };
}

/** Minimal V3 payload for unit tests — not exhaustive. */
export function minimalV3Payload(overall: "healthy" | "limited" | "warning" | "critical" = "healthy"): CompanyCommandCenterV3Payload {
  const u = { status: "unavailable" as const, summary: "s", detailsHref: null as string | null };
  const systems = {
    brain: {
      ...u,
      status: "healthy" as const,
      shadowObservationEnabled: false,
      influenceEnabled: false,
      primaryEnabled: false,
      fallbackRatePct: 5,
      warningCount: 0,
      comparisonRuns: null,
      avgOverlapRate: null,
      lastReportAt: null,
      topIssue: null,
      topRecommendation: null,
    },
    ads: {
      ...u,
      status: "healthy" as const,
      shadowMode: false,
      v8Rollout: false,
      influenceEnabled: false,
      primaryEnabled: false,
      comparisonRuns: null,
      avgOverlapRate: null,
      avgDivergenceRate: null,
      pctRunsRisky: 10,
      anomalyNote: null,
      topRecommendation: null,
    },
    cro: { ...u, analysisEnabled: false, healthScore: null, topBottleneck: "checkout", dropoffSummary: null, recommendationCount: null, readinessNote: null, warningSummary: null },
    ranking: { ...u, totalScore: 10, maxScore: 20, recommendation: null, readinessGatesOk: null, readinessGatesTotal: null, rollbackAny: false, top5Overlap: null, avgRankShift: null, warningsCount: null },
    operator: { ...u, executionPlanFlag: false, simulationFlag: false, conflictEngineFlag: false, priorityScoringFlag: false, planCount: null, conflictCount: null, topRecommendation: null },
    platformCore: { ...u, priorityEnabled: false, dependenciesEnabled: false, schedulerEnabled: false, simulationEnabled: false, pendingDecisions: null, blockedDecisions: null, overdueSchedules: 0, blockedDependencyEdges: null, healthWarnings: [] },
    fusion: { ...u, orchestrationActive: false, influenceEnabled: false, primaryEnabled: false, agreementHint: null, conflictCount: 0, recommendationCount: null, healthNote: null, topRecommendation: null },
    growthLoop: { ...u, systemEnabled: false, executionEnabled: false, simulationEnabled: false, lastRunStatus: null, lastRunAt: null, actionsProposed: null, actionsExecuted: null, notes: null },
    swarm: { ...u, enabled: false, negotiationEnabled: false, influenceEnabled: false, primaryEnabled: false, agentSlots: 0, conflictCount: null, humanReviewCount: null, topOpportunity: null, negotiationNote: null },
  };

  return {
    shared: {
      overallStatus: overall,
      systems,
      rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
      quickKpis: [],
      meta: {
        dataFreshnessMs: 1,
        sourcesUsed: [],
        missingSources: [],
        systemsLoadedCount: 1,
        overallStatus: overall,
        partialData: false,
      },
    },
    roles: {
      founder: emptyRole("founder"),
      growth: emptyRole("growth"),
      operations: emptyRole("operations"),
      riskGovernance: emptyRole("risk_governance"),
    },
    focusedRole: null,
  };
}
