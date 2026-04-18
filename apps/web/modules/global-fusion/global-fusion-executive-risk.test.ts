import { describe, expect, it, beforeEach } from "vitest";
import { buildExecutiveRisksAndBlockers, resetGlobalFusionExecutiveRiskSeqForTests } from "./global-fusion-executive-risk.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";

function minimalSnap(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [],
    risks: [
      { id: "r1", title: "SR", systems: ["brain"], severity: "medium", rationale: "z" },
    ],
    conflicts: [
      {
        id: "c1",
        systems: ["brain", "ads"],
        severity: "medium",
        summary: "Tension",
        recommendation: "monitor_only",
        detail: "d",
      },
    ],
    recommendations: [],
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
    snapshot: minimalSnap(),
    health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 0 },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain"],
      missingSources: [],
      contributingSystemsCount: 2,
      normalizedSignalCount: 2,
      conflictCount: 1,
      recommendationCount: 0,
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
      runsTotal: 10,
      fallbackRate: 0.4,
      missingSourceRate: 0.45,
      conflictRate: 0.42,
      disagreementRate: 0.2,
      lowEvidenceRate: 0.5,
      anomalyRate: 0.3,
      unstableOrderingRate: 0.25,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: { learningRuns: 3, weightDriftL1: 0.02, insufficientLinkageRate: 0.5 },
    freezeState: { learningFrozen: true, influenceFrozen: false, reason: "test", frozenAt: new Date().toISOString() },
    ...over,
  };
}

describe("global-fusion-executive-risk", () => {
  beforeEach(() => {
    resetGlobalFusionExecutiveRiskSeqForTests();
  });

  it("surfaces multiple executive risks from monitoring thresholds", () => {
    const { risks } = buildExecutiveRisksAndBlockers(assembly());
    expect(risks.length).toBeGreaterThan(2);
    expect(risks[0].severity).toMatch(/high|medium|low/);
  });

  it("includes blockers for freeze and conflicts", () => {
    const { blockers } = buildExecutiveRisksAndBlockers(assembly());
    expect(blockers.some((b) => b.title.includes("Fusion-local freeze"))).toBe(true);
    expect(blockers.some((b) => b.dependencies.some((d) => d.startsWith("conflict_")))).toBe(true);
  });
});
