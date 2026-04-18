import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { loadCompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.service";
import { mapOperationsRole } from "./role-mappers/operations-role-mapper";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";

function minimalV1(): AiControlCenterPayload {
  const u = { status: "unavailable" as const, summary: "s", detailsHref: null as string | null };
  return {
    systems: {
      brain: { ...u, shadowObservationEnabled: false, influenceEnabled: false, primaryEnabled: false, fallbackRatePct: null, warningCount: 0, comparisonRuns: null, avgOverlapRate: null, lastReportAt: null, topIssue: null, topRecommendation: null },
      ads: { ...u, shadowMode: false, v8Rollout: false, influenceEnabled: false, primaryEnabled: false, comparisonRuns: null, avgOverlapRate: null, avgDivergenceRate: null, pctRunsRisky: null, anomalyNote: null, topRecommendation: null },
      cro: { ...u, analysisEnabled: false, healthScore: null, topBottleneck: null, dropoffSummary: null, recommendationCount: null, readinessNote: null, warningSummary: null },
      ranking: { ...u, totalScore: null, maxScore: null, recommendation: null, readinessGatesOk: null, readinessGatesTotal: null, rollbackAny: false, top5Overlap: null, avgRankShift: null, warningsCount: null },
      operator: { ...u, executionPlanFlag: true, simulationFlag: false, conflictEngineFlag: false, priorityScoringFlag: false, planCount: 2, conflictCount: 3, topRecommendation: "Run plan" },
      platformCore: { ...u, priorityEnabled: false, dependenciesEnabled: false, schedulerEnabled: true, simulationEnabled: false, pendingDecisions: 1, blockedDecisions: 0, overdueSchedules: 0, blockedDependencyEdges: 0, healthWarnings: [] },
      fusion: { ...u, orchestrationActive: false, influenceEnabled: false, primaryEnabled: false, agreementHint: null, conflictCount: null, recommendationCount: null, healthNote: null, topRecommendation: null },
      growthLoop: { ...u, systemEnabled: false, executionEnabled: false, simulationEnabled: false, lastRunStatus: null, lastRunAt: null, actionsProposed: null, actionsExecuted: null, notes: null },
      swarm: { ...u, enabled: false, negotiationEnabled: false, influenceEnabled: false, primaryEnabled: false, agentSlots: 0, conflictCount: 2, humanReviewCount: null, topOpportunity: null, negotiationNote: null },
    },
    executiveSummary: {
      overallStatus: "healthy",
      criticalWarnings: [],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 9,
      systemsWarningCount: 0,
      systemsCriticalCount: 0,
    },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    unifiedWarnings: [],
    history: [],
    meta: { dataFreshnessMs: 1, sourcesUsed: ["t"], missingSources: [], systemsLoadedCount: 1 },
  };
}

describe("mapOperationsRole", () => {
  it("surfaces operator conflicts in risks", async () => {
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalV1());
    const v2 = await loadCompanyCommandCenterV2Payload({});
    const o = mapOperationsRole(v2);
    expect(o.topRisks.some((r) => r.label.includes("operator conflicts"))).toBe(true);
    expect(o.role).toBe("operations");
  });
});
