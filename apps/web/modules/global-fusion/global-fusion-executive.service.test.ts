import { describe, expect, it, beforeEach, vi } from "vitest";
import type { GlobalFusionAggregateMonitoringSnapshot } from "./global-fusion-monitoring.service";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionV1: true,
      globalFusionExecutiveLayerV1: true,
    },
  };
});

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logWarn: vi.fn() }));

import { globalFusionFlags } from "@/config/feature-flags";
import {
  buildGlobalFusionExecutiveSummary,
  buildGlobalFusionExecutiveSummaryFromAssembly,
  monitoringSnapshotToExecutiveInput,
} from "./global-fusion-executive.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";
import { resetGlobalFusionExecutiveMonitoringForTests } from "./global-fusion-executive-monitoring.service";

function minimalSnapshot(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [{ id: "o1", title: "Grow", systems: ["brain"], confidence: 0.7, rationale: "x" }],
    risks: [{ id: "r1", title: "R", systems: ["cro"], severity: "low", rationale: "y" }],
    recommendations: [
      {
        kind: "prioritize_growth",
        title: "G",
        why: "because",
        systemsAgreed: ["brain", "ads"],
        systemsDisagreed: [],
        confidenceSummary: "c",
        riskSummary: "r",
        evidenceSummary: "e",
      },
    ],
    conflicts: [],
    scores: {
      fusedConfidence: 0.7,
      fusedPriority: 0.6,
      fusedRisk: 0.3,
      actionability: 0.6,
      agreementScore: 0.72,
      evidenceScore: 0.55,
    },
    signals: [],
    influence: null,
  };
}

function minimalPayload(): GlobalFusionPayload {
  return {
    enabled: true,
    snapshot: minimalSnapshot(),
    health: {
      overallStatus: "ok",
      observationalWarnings: [],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
    },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain", "ads"],
      missingSources: [],
      contributingSystemsCount: 2,
      normalizedSignalCount: 4,
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

function baseAssembly(over: Partial<GlobalFusionExecutiveAssemblyInput> = {}): GlobalFusionExecutiveAssemblyInput {
  return {
    fusionPayload: minimalPayload(),
    primaryResult: null,
    monitoring: {
      runsTotal: 10,
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

describe("global-fusion-executive.service", () => {
  beforeEach(() => {
    resetGlobalFusionExecutiveMonitoringForTests();
    (globalFusionFlags as { globalFusionExecutiveLayerV1: boolean }).globalFusionExecutiveLayerV1 = true;
  });

  it("assembles summary from valid assembly input without mutating payload", () => {
    const payload = minimalPayload();
    const input = baseAssembly({ fusionPayload: payload });
    const snapBefore = JSON.stringify(payload);
    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(input, null);
    expect(JSON.stringify(payload)).toBe(snapBefore);
    expect(summary.topPriorities.length).toBeGreaterThan(0);
    expect(summary.topOpportunities.length).toBeGreaterThan(0);
    expect(summary.overallStatus).toMatch(/healthy|watch|caution|degraded/);
  });

  it("degrades gracefully when snapshot is null", () => {
    const p = minimalPayload();
    p.snapshot = null;
    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(baseAssembly({ fusionPayload: p }), null);
    expect(summary.notes.some((n) => n.includes("no_fusion_snapshot"))).toBe(true);
  });

  it("returns disabled summary when executive layer flag is off", async () => {
    (globalFusionFlags as { globalFusionExecutiveLayerV1: boolean }).globalFusionExecutiveLayerV1 = false;
    const s = await buildGlobalFusionExecutiveSummary({});
    expect(s.disabled).toBe(true);
  });

  it("monitoringSnapshotToExecutiveInput maps aggregate snapshot fields", () => {
    const snap: GlobalFusionAggregateMonitoringSnapshot = {
      runsTotal: 5,
      runsPrimary: 4,
      runsFallback: 1,
      runsSourceAdvisoryDefault: 0,
      fallbackRate: 0.2,
      systemsCoverage: { brain: 1, ads: 1, cro: 1, ranking: 1 },
      missingSourceRate: 0.1,
      conflictRate: 0.1,
      disagreementRate: 0.1,
      lowEvidenceRate: 0.1,
      influenceAppliedRate: 0.5,
      influenceSkippedRate: 0.5,
      unstableOrderingRate: 0.1,
      anomalyRate: 0.1,
      malformedInputRate: 0.02,
      emptyOutputRate: 0,
      counters: {
        runsTotal: 5,
        runsPrimary: 4,
        runsFallback: 1,
        runsSourceAdvisoryDefault: 0,
        missingSourceRuns: 0,
        highConflictRuns: 0,
        highDisagreementRuns: 0,
        lowEvidenceRuns: 0,
        emptyOutputRuns: 0,
        malformedInputRuns: 0,
        influenceAppliedRuns: 0,
        influenceSkippedRuns: 0,
        unstableOrderingRuns: 0,
        anomalyRuns: 0,
        warningSamples: 0,
      },
      lastUpdatedAt: new Date().toISOString(),
    };
    const m = monitoringSnapshotToExecutiveInput(snap);
    expect(m.runsTotal).toBe(5);
    expect(m.fallbackRate).toBe(0.2);
  });
});
