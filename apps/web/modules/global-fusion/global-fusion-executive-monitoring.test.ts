import { describe, expect, it, beforeEach } from "vitest";
import {
  recordExecutiveSummaryGenerated,
  getExecutiveMonitoringSummary,
  resetGlobalFusionExecutiveMonitoringForTests,
} from "./global-fusion-executive-monitoring.service";
import { buildGlobalFusionExecutiveSummaryFromAssembly } from "./global-fusion-executive.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";

function minimalSnap(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [],
    risks: [],
    recommendations: [
      {
        kind: "prioritize_stability",
        title: "S",
        why: "w",
        systemsAgreed: ["brain"],
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

function assembly(): GlobalFusionExecutiveAssemblyInput {
  const fusionPayload: GlobalFusionPayload = {
    enabled: true,
    snapshot: minimalSnap(),
    health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 3 },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain"],
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
  return {
    fusionPayload,
    primaryResult: null,
    monitoring: {
      runsTotal: 10,
      fallbackRate: 0.1,
      missingSourceRate: 0.36,
      conflictRate: 0.1,
      disagreementRate: 0.1,
      lowEvidenceRate: 0.1,
      anomalyRate: 0.1,
      unstableOrderingRate: 0.1,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: null,
    freezeState: { learningFrozen: false, influenceFrozen: false, reason: null, frozenAt: null },
  };
}

describe("global-fusion-executive-monitoring", () => {
  beforeEach(() => {
    resetGlobalFusionExecutiveMonitoringForTests();
  });

  it("records counts after summary generation hook", () => {
    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(assembly(), null);
    recordExecutiveSummaryGenerated(summary);
    const m = getExecutiveMonitoringSummary();
    expect(m.summariesGenerated).toBe(1);
    expect(m.lastSummaryAt).toBeTruthy();
  });
});
