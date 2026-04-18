import { describe, expect, it } from "vitest";
import type {
  CommandCenterRole,
  CommandCenterRoleView,
  CompanyCommandCenterV3Payload,
} from "@/modules/control-center-v3/company-command-center-v3.types";
import { buildSystemDeltas } from "./company-command-center-delta.service";

function shellV3(overall: "healthy" | "limited" | "warning" | "critical", brainFb: number | null): CompanyCommandCenterV3Payload {
  const u = { status: "unavailable" as const, summary: "s", detailsHref: null as string | null };
  const systems = {
    brain: {
      ...u,
      status: "healthy" as const,
      shadowObservationEnabled: false,
      influenceEnabled: false,
      primaryEnabled: false,
      fallbackRatePct: brainFb,
      warningCount: 0,
      comparisonRuns: null,
      avgOverlapRate: null,
      lastReportAt: null,
      topIssue: null,
      topRecommendation: null,
    },
    ads: { ...u, shadowMode: false, v8Rollout: false, influenceEnabled: false, primaryEnabled: false, comparisonRuns: null, avgOverlapRate: null, avgDivergenceRate: null, pctRunsRisky: null, anomalyNote: null, topRecommendation: null },
    cro: { ...u, analysisEnabled: false, healthScore: null, topBottleneck: null, dropoffSummary: null, recommendationCount: null, readinessNote: null, warningSummary: null },
    ranking: { ...u, totalScore: 10, maxScore: 20, recommendation: null, readinessGatesOk: null, readinessGatesTotal: null, rollbackAny: false, top5Overlap: null, avgRankShift: null, warningsCount: null },
    operator: { ...u, executionPlanFlag: false, simulationFlag: false, conflictEngineFlag: false, priorityScoringFlag: false, planCount: null, conflictCount: null, topRecommendation: null },
    platformCore: { ...u, priorityEnabled: false, dependenciesEnabled: false, schedulerEnabled: false, simulationEnabled: false, pendingDecisions: null, blockedDecisions: null, overdueSchedules: null, blockedDependencyEdges: null, healthWarnings: [] },
    fusion: { ...u, orchestrationActive: false, influenceEnabled: false, primaryEnabled: false, agreementHint: null, conflictCount: null, recommendationCount: null, healthNote: null, topRecommendation: null },
    growthLoop: { ...u, systemEnabled: false, executionEnabled: false, simulationEnabled: false, lastRunStatus: null, lastRunAt: null, actionsProposed: null, actionsExecuted: null, notes: null },
    swarm: { ...u, enabled: false, negotiationEnabled: false, influenceEnabled: false, primaryEnabled: false, agentSlots: 0, conflictCount: null, humanReviewCount: null, topOpportunity: null, negotiationNote: null },
  };

  const emptyRole = (role: CommandCenterRole): CommandCenterRoleView => ({
    role,
    heroSummary: "",
    topPriorities: [],
    topRisks: [],
    topBlockers: [],
    recommendedFocusAreas: [],
    systems: { highlights: [] },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    warnings: [],
  });

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

describe("buildSystemDeltas", () => {
  it("returns insufficient baseline when previous missing systems", () => {
    const cur = shellV3("healthy", 5);
    const prev = { ...shellV3("healthy", 4), shared: { ...shellV3("healthy", 4).shared, systems: null } };
    const r = buildSystemDeltas(cur, prev as CompanyCommandCenterV3Payload);
    expect(r.insufficientBaseline).toBe(true);
  });

  it("detects brain fallback delta when both values present", () => {
    const cur = shellV3("healthy", 6);
    const prev = shellV3("healthy", 5);
    const r = buildSystemDeltas(cur, prev);
    const b = r.systems.find((s) => s.system === "brain");
    expect(b?.changedMetrics.some((m) => m.includes("Fallback"))).toBe(true);
  });
});
