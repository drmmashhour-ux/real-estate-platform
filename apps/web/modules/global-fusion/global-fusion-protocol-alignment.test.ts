import { describe, expect, it, beforeEach } from "vitest";
import {
  buildProtocolAlignmentAndConflicts,
  resetGlobalFusionProtocolAlignmentSeqForTests,
} from "./global-fusion-protocol-alignment.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionExecutiveSummary } from "./global-fusion.types";

function execGrowth(): GlobalFusionExecutiveSummary {
  return {
    overallStatus: "caution",
    companyReadiness: { label: "limited", summary: "x", factors: ["a"] },
    topPriorities: [{ id: "p1", theme: "growth_acceleration", importance: "high", title: "G", summary: "s", sourceSystems: ["brain"], supportingSignals: [], blockers: [], risks: [], confidence: 0.7, evidenceSummary: "e" }],
    topRisks: [],
    topOpportunities: [],
    topBlockers: [],
    themes: [{ id: "growth_acceleration", label: "G", signalStrength: 0.5, supportingPriorityIds: ["p1"] }],
    rolloutSummary: {
      pathLabel: "global_fusion_primary",
      primaryActive: true,
      fallbackRate: 0.1,
      missingSourceRate: 0.1,
      conflictRate: 0.5,
      governanceDecision: "caution",
    },
    healthSummary: {
      overallStatus: "ok",
      observationalWarnings: [],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
      fusedAgreementApprox: 0.6,
    },
    notes: [],
    narrativeBlocks: [],
    provenance: {
      generatedAt: new Date().toISOString(),
      fusionV1Enabled: true,
      executiveLayerEnabled: true,
      contributingSystemsCount: 2,
      normalizedSignalCount: 4,
      sourcesUsed: ["brain"],
    },
  };
}

function assemblyBlocked(): GlobalFusionExecutiveAssemblyInput {
  return {
    fusionPayload: {
      enabled: true,
      snapshot: null,
      health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 0 },
      meta: {
        dataFreshnessMs: 0,
        sourcesUsed: [],
        missingSources: [],
        contributingSystemsCount: 0,
        normalizedSignalCount: 0,
        conflictCount: 0,
        recommendationCount: 0,
        persistenceLogged: false,
        influenceFlag: false,
        primaryFlag: false,
        influenceApplied: false,
        malformedNormalizedCount: 0,
      },
    },
    primaryResult: null,
    monitoring: {
      runsTotal: 10,
      fallbackRate: 0.45,
      missingSourceRate: 0.1,
      conflictRate: 0.5,
      disagreementRate: 0.2,
      lowEvidenceRate: 0.5,
      anomalyRate: 0.1,
      unstableOrderingRate: 0.1,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: null,
    freezeState: { learningFrozen: true, influenceFrozen: false, reason: "t", frozenAt: new Date().toISOString() },
  };
}

describe("global-fusion-protocol-alignment", () => {
  beforeEach(() => {
    resetGlobalFusionProtocolAlignmentSeqForTests();
  });

  it("flags growth vs operator tension when freeze blocks execution path", () => {
    const { conflicts } = buildProtocolAlignmentAndConflicts(execGrowth(), assemblyBlocked());
    expect(conflicts.some((c) => c.description.includes("Growth-oriented"))).toBe(true);
  });
});
