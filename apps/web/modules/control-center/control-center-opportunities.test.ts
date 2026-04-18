import { describe, expect, it } from "vitest";
import { extractTopOpportunities, extractTopRisks, countSystemBuckets } from "./control-center-opportunities";
import type { AiControlCenterPayload } from "./ai-control-center.types";

function minimalPayload(overrides: Partial<AiControlCenterPayload> = {}): AiControlCenterPayload {
  const base: AiControlCenterPayload = {
    systems: {
      brain: {
        status: "healthy",
        summary: "",
        shadowObservationEnabled: true,
        influenceEnabled: false,
        primaryEnabled: false,
        fallbackRatePct: 5,
        warningCount: 0,
        comparisonRuns: 1,
        avgOverlapRate: 0.8,
        lastReportAt: null,
        topIssue: null,
        topRecommendation: null,
        detailsHref: null,
      },
      ads: {
        status: "healthy",
        summary: "",
        shadowMode: true,
        v8Rollout: true,
        influenceEnabled: false,
        primaryEnabled: false,
        comparisonRuns: 2,
        avgOverlapRate: 0.8,
        avgDivergenceRate: 0.1,
        pctRunsRisky: 10,
        anomalyNote: null,
        topRecommendation: null,
        detailsHref: null,
      },
      cro: {
        status: "limited",
        summary: "",
        analysisEnabled: true,
        healthScore: 70,
        topBottleneck: "a→b",
        dropoffSummary: "2",
        recommendationCount: 3,
        readinessNote: null,
        warningSummary: null,
        detailsHref: null,
      },
      ranking: {
        status: "limited",
        summary: "",
        totalScore: 20,
        maxScore: 25,
        recommendation: "candidate_for_primary",
        readinessGatesOk: 3,
        readinessGatesTotal: 5,
        rollbackAny: false,
        top5Overlap: 0.7,
        avgRankShift: 1,
        warningsCount: 0,
        detailsHref: null,
      },
      operator: {
        status: "healthy",
        summary: "",
        executionPlanFlag: true,
        simulationFlag: true,
        conflictEngineFlag: true,
        priorityScoringFlag: true,
        planCount: null,
        conflictCount: null,
        topRecommendation: "x",
        detailsHref: null,
      },
      platformCore: {
        status: "warning",
        summary: "",
        priorityEnabled: true,
        dependenciesEnabled: true,
        schedulerEnabled: true,
        simulationEnabled: true,
        pendingDecisions: 1,
        blockedDecisions: 2,
        overdueSchedules: 0,
        blockedDependencyEdges: 0,
        healthWarnings: ["test warning"],
        detailsHref: null,
      },
      fusion: {
        status: "warning",
        summary: "",
        orchestrationActive: true,
        influenceEnabled: false,
        primaryEnabled: false,
        agreementHint: "ok",
        conflictCount: 8,
        recommendationCount: 2,
        healthNote: null,
        topRecommendation: "merge bids",
        detailsHref: null,
      },
      growthLoop: {
        status: "limited",
        summary: "",
        systemEnabled: true,
        executionEnabled: false,
        simulationEnabled: false,
        lastRunStatus: "completed",
        lastRunAt: null,
        actionsProposed: 4,
        actionsExecuted: 0,
        notes: null,
        detailsHref: null,
      },
      swarm: {
        status: "limited",
        summary: "",
        enabled: true,
        negotiationEnabled: true,
        influenceEnabled: false,
        primaryEnabled: false,
        agentSlots: 8,
        conflictCount: null,
        humanReviewCount: null,
        topOpportunity: null,
        negotiationNote: null,
        detailsHref: null,
      },
    },
    executiveSummary: {
      overallStatus: "healthy",
      criticalWarnings: [],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 0,
      systemsWarningCount: 0,
      systemsCriticalCount: 0,
    },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    unifiedWarnings: [],
    history: [],
    meta: { dataFreshnessMs: 0, sourcesUsed: [], missingSources: [], systemsLoadedCount: 0 },
  };
  return { ...base, ...overrides };
}

describe("control-center-opportunities", () => {
  it("extracts opportunities when ranking suggests expansion", () => {
    const p = minimalPayload();
    const op = extractTopOpportunities(p);
    expect(op.some((x) => x.includes("Ranking"))).toBe(true);
  });

  it("extracts risks when rollback signals", () => {
    const p = minimalPayload({
      systems: {
        ...minimalPayload().systems,
        ranking: { ...minimalPayload().systems.ranking, rollbackAny: true, recommendation: "rollback_recommended" },
      },
    });
    const r = extractTopRisks(p);
    expect(r.length).toBeGreaterThan(0);
  });

  it("counts buckets", () => {
    const p = minimalPayload();
    const c = countSystemBuckets(p.systems);
    expect(c.healthy + c.warning + c.critical).toBe(9);
  });
});
