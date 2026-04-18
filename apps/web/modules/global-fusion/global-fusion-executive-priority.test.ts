import { describe, expect, it, beforeEach } from "vitest";
import {
  buildExecutivePrioritiesFromAssembly,
  clusterExecutiveThemes,
  resetGlobalFusionExecutivePrioritySeqForTests,
} from "./global-fusion-executive-priority.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";

function snap(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [],
    risks: [],
    recommendations: [
      {
        kind: "fix_funnel_first",
        title: "Funnel",
        why: "CRO weak",
        systemsAgreed: ["cro"],
        systemsDisagreed: [],
        confidenceSummary: "c",
        riskSummary: "r",
        evidenceSummary: "e",
      },
    ],
    conflicts: [],
    scores: {
      fusedConfidence: 0.5,
      fusedPriority: 0.5,
      fusedRisk: 0.5,
      actionability: 0.5,
      agreementScore: 0.5,
      evidenceScore: 0.5,
    },
    signals: [],
    influence: null,
  };
}

function payload(): GlobalFusionPayload {
  return {
    enabled: true,
    snapshot: snap(),
    health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 0 },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["cro"],
      missingSources: [],
      contributingSystemsCount: 1,
      normalizedSignalCount: 1,
      conflictCount: 0,
      recommendationCount: 1,
      persistenceLogged: false,
      influenceFlag: false,
      primaryFlag: true,
      influenceApplied: false,
      malformedNormalizedCount: 0,
    },
  };
}

function assembly(over: Partial<GlobalFusionExecutiveAssemblyInput> = {}): GlobalFusionExecutiveAssemblyInput {
  return {
    fusionPayload: payload(),
    primaryResult: null,
    monitoring: {
      runsTotal: 8,
      fallbackRate: 0.1,
      missingSourceRate: 0.1,
      conflictRate: 0.2,
      disagreementRate: 0.2,
      lowEvidenceRate: 0.2,
      anomalyRate: 0.05,
      unstableOrderingRate: 0.05,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: null,
    freezeState: { learningFrozen: false, influenceFrozen: false, reason: null, frozenAt: null },
    ...over,
  };
}

describe("global-fusion-executive-priority", () => {
  beforeEach(() => {
    resetGlobalFusionExecutivePrioritySeqForTests();
  });

  it("maps funnel recommendation to funnel_first theme", () => {
    const priorities = buildExecutivePrioritiesFromAssembly(assembly());
    expect(priorities.some((p) => p.theme === "funnel_first")).toBe(true);
  });

  it("clusters themes from priorities", () => {
    const priorities = buildExecutivePrioritiesFromAssembly(assembly());
    const themes = clusterExecutiveThemes(priorities);
    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0].supportingPriorityIds.length).toBeGreaterThan(0);
  });
});
