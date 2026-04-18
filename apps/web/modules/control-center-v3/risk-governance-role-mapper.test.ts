import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { loadCompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.service";
import { mapRiskGovernanceRole } from "./role-mappers/risk-governance-role-mapper";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";

function minimalV1(): AiControlCenterPayload {
  const u = { status: "unavailable" as const, summary: "s", detailsHref: null as string | null };
  return {
    systems: {
      brain: { ...u, shadowObservationEnabled: false, influenceEnabled: false, primaryEnabled: false, fallbackRatePct: 22, warningCount: 0, comparisonRuns: null, avgOverlapRate: null, lastReportAt: null, topIssue: null, topRecommendation: null },
      ads: { ...u, shadowMode: false, v8Rollout: false, influenceEnabled: false, primaryEnabled: false, comparisonRuns: null, avgOverlapRate: null, avgDivergenceRate: null, pctRunsRisky: null, anomalyNote: null, topRecommendation: null },
      cro: { ...u, analysisEnabled: false, healthScore: null, topBottleneck: null, dropoffSummary: null, recommendationCount: null, readinessNote: null, warningSummary: null },
      ranking: { ...u, totalScore: null, maxScore: null, recommendation: null, readinessGatesOk: null, readinessGatesTotal: null, rollbackAny: true, top5Overlap: null, avgRankShift: null, warningsCount: 2 },
      operator: { ...u, executionPlanFlag: false, simulationFlag: false, conflictEngineFlag: false, priorityScoringFlag: false, planCount: null, conflictCount: null, topRecommendation: null },
      platformCore: { ...u, priorityEnabled: false, dependenciesEnabled: false, schedulerEnabled: false, simulationEnabled: false, pendingDecisions: null, blockedDecisions: null, overdueSchedules: null, blockedDependencyEdges: null, healthWarnings: [] },
      fusion: { ...u, orchestrationActive: false, influenceEnabled: false, primaryEnabled: false, agreementHint: "Low agreement", conflictCount: 1, recommendationCount: null, healthNote: null, topRecommendation: null },
      growthLoop: { ...u, systemEnabled: false, executionEnabled: false, simulationEnabled: false, lastRunStatus: null, lastRunAt: null, actionsProposed: null, actionsExecuted: null, notes: null },
      swarm: { ...u, enabled: false, negotiationEnabled: false, influenceEnabled: false, primaryEnabled: false, agentSlots: 0, conflictCount: null, humanReviewCount: null, topOpportunity: null, negotiationNote: null },
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
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: ["Ranking"] },
    unifiedWarnings: [],
    history: [],
    meta: { dataFreshnessMs: 1, sourcesUsed: ["t"], missingSources: [], systemsLoadedCount: 1 },
  };
}

describe("mapRiskGovernanceRole", () => {
  it("flags rollback and fusion conflict strings", async () => {
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalV1());
    const v2 = await loadCompanyCommandCenterV2Payload({});
    const r = mapRiskGovernanceRole(v2);
    expect(r.topRisks.some((x) => x.label.includes("rollback") || x.label.includes("Ranking"))).toBe(true);
    expect(r.topBlockers.length).toBeGreaterThan(0);
    expect(r.role).toBe("risk_governance");
  });
});
