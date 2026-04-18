import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { loadCompanyCommandCenterV3Payload } from "./company-command-center-v3.service";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";

function minimalV1(): AiControlCenterPayload {
  const unavailable = {
    status: "unavailable" as const,
    summary: "x",
    detailsHref: null,
  };
  return {
    systems: {
      brain: {
        ...unavailable,
        shadowObservationEnabled: false,
        influenceEnabled: false,
        primaryEnabled: false,
        fallbackRatePct: null,
        warningCount: 0,
        comparisonRuns: null,
        avgOverlapRate: null,
        lastReportAt: null,
        topIssue: null,
        topRecommendation: null,
      },
      ads: {
        ...unavailable,
        shadowMode: false,
        v8Rollout: false,
        influenceEnabled: false,
        primaryEnabled: false,
        comparisonRuns: null,
        avgOverlapRate: null,
        avgDivergenceRate: null,
        pctRunsRisky: null,
        anomalyNote: null,
        topRecommendation: null,
      },
      cro: {
        ...unavailable,
        analysisEnabled: false,
        healthScore: null,
        topBottleneck: null,
        dropoffSummary: null,
        recommendationCount: null,
        readinessNote: null,
        warningSummary: null,
      },
      ranking: {
        ...unavailable,
        totalScore: null,
        maxScore: null,
        recommendation: null,
        readinessGatesOk: null,
        readinessGatesTotal: null,
        rollbackAny: false,
        top5Overlap: null,
        avgRankShift: null,
        warningsCount: null,
      },
      operator: {
        ...unavailable,
        executionPlanFlag: false,
        simulationFlag: false,
        conflictEngineFlag: false,
        priorityScoringFlag: false,
        planCount: null,
        conflictCount: null,
        topRecommendation: null,
      },
      platformCore: {
        ...unavailable,
        priorityEnabled: false,
        dependenciesEnabled: false,
        schedulerEnabled: false,
        simulationEnabled: false,
        pendingDecisions: null,
        blockedDecisions: null,
        overdueSchedules: null,
        blockedDependencyEdges: null,
        healthWarnings: [],
      },
      fusion: {
        ...unavailable,
        orchestrationActive: false,
        influenceEnabled: false,
        primaryEnabled: false,
        agreementHint: null,
        conflictCount: null,
        recommendationCount: null,
        healthNote: null,
        topRecommendation: null,
      },
      growthLoop: {
        ...unavailable,
        systemEnabled: false,
        executionEnabled: false,
        simulationEnabled: false,
        lastRunStatus: null,
        lastRunAt: null,
        actionsProposed: null,
        actionsExecuted: null,
        notes: null,
      },
      swarm: {
        ...unavailable,
        enabled: false,
        negotiationEnabled: false,
        influenceEnabled: false,
        primaryEnabled: false,
        agentSlots: 0,
        conflictCount: null,
        humanReviewCount: null,
        topOpportunity: null,
        negotiationNote: null,
      },
    },
    executiveSummary: {
      overallStatus: "healthy",
      criticalWarnings: [],
      topOpportunities: ["Expand ranking"],
      topRisks: ["Watch ads"],
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

describe("loadCompanyCommandCenterV3Payload", () => {
  it("assembles shared + four roles from V2", async () => {
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalV1());
    const p = await loadCompanyCommandCenterV3Payload({});
    expect(p.shared.systems).toBeDefined();
    expect(p.roles.founder.role).toBe("founder");
    expect(p.roles.growth.role).toBe("growth");
    expect(p.roles.operations.role).toBe("operations");
    expect(p.roles.riskGovernance.role).toBe("risk_governance");
    expect(p.shared.meta.sourcesUsed.some((s) => s.includes("control_center_v3"))).toBe(true);
  });

  it("narrows to focused role when role=growth", async () => {
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalV1());
    const p = await loadCompanyCommandCenterV3Payload({ role: "growth" });
    expect(p.focusedRole).toBe("growth");
    expect(p.roles.growth.heroSummary.length).toBeGreaterThan(0);
    expect(p.roles.founder.heroSummary).toBe("Data unavailable for this view.");
  });
});
