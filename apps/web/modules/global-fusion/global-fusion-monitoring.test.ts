import { describe, expect, it, beforeEach } from "vitest";
import type { GlobalFusionPrimarySurfaceResult } from "./global-fusion.types";
import {
  getGlobalFusionMonitoringSnapshot,
  recordGlobalFusionConflict,
  recordGlobalFusionFallback,
  recordGlobalFusionRun,
  recordGlobalFusionWarning,
  resetGlobalFusionMonitoringForTests,
} from "./global-fusion-monitoring.service";

function baseResult(over: Partial<GlobalFusionPrimarySurfaceResult> = {}): GlobalFusionPrimarySurfaceResult {
  const fusionPayload = {
    enabled: true,
    snapshot: {
      generatedAt: new Date().toISOString(),
      opportunities: [{ id: "o1", title: "O", systems: ["brain"] as const, confidence: 0.7, rationale: "r" }],
      risks: [],
      recommendations: [],
      conflicts: [],
      scores: {
        fusedConfidence: 0.6,
        fusedPriority: 0.5,
        fusedRisk: 0.4,
        actionability: 0.5,
        agreementScore: 0.6,
        evidenceScore: 0.5,
      },
      signals: [
        {
          id: "b:1",
          source: "brain" as const,
          targetType: "subsystem" as const,
          targetId: "t",
          confidence: 0.7,
          priority: 0.5,
          risk: 0.3,
          evidenceQuality: 0.5,
          recommendationType: null,
          reason: [],
          blockers: [],
          metrics: {},
          timestamp: new Date().toISOString(),
          freshnessMs: 1,
          provenance: "p",
        },
        {
          id: "a:1",
          source: "ads" as const,
          targetType: "subsystem" as const,
          targetId: "t",
          confidence: 0.65,
          priority: 0.5,
          risk: 0.35,
          evidenceQuality: 0.5,
          recommendationType: null,
          reason: [],
          blockers: [],
          metrics: {},
          timestamp: new Date().toISOString(),
          freshnessMs: 1,
          provenance: "p",
        },
      ],
      influence: null,
    },
    health: {
      overallStatus: "ok" as const,
      observationalWarnings: [],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
    },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain", "global_fusion:v1"],
      missingSources: [] as string[],
      contributingSystemsCount: 2,
      normalizedSignalCount: 2,
      conflictCount: 0,
      recommendationCount: 0,
      persistenceLogged: false,
      influenceFlag: false,
      primaryFlag: true,
      influenceApplied: false,
      malformedNormalizedCount: 0,
    },
  };
  return {
    path: "global_fusion_primary",
    primarySurfaceActive: true,
    surface: null,
    fusionPayload,
    validation: { ok: true, reasons: [] },
    observationalWarnings: [],
    ...over,
  };
}

describe("Global Fusion Phase D monitoring", () => {
  beforeEach(() => {
    resetGlobalFusionMonitoringForTests();
  });

  it("increments runs and primary on global_fusion_primary", () => {
    recordGlobalFusionRun(baseResult());
    const s = getGlobalFusionMonitoringSnapshot();
    expect(s.runsTotal).toBe(1);
    expect(s.runsPrimary).toBe(1);
    expect(s.fallbackRate).toBe(0);
    expect(Number.isFinite(s.systemsCoverage.brain)).toBe(true);
  });

  it("records fallback path", () => {
    recordGlobalFusionRun(
      baseResult({
        path: "global_fusion_primary_fallback_default",
        primarySurfaceActive: false,
        validation: { ok: false, reasons: ["subsystem_coverage_weak"] },
      }),
    );
    const s = getGlobalFusionMonitoringSnapshot();
    expect(s.runsFallback).toBe(1);
    expect(s.fallbackRate).toBe(1);
  });

  it("recordGlobalFusionFallback stores reason without throwing", () => {
    expect(() => recordGlobalFusionFallback("test_reason")).not.toThrow();
  });

  it("recordGlobalFusionConflict increments warning samples", () => {
    recordGlobalFusionConflict({ highSeverityCount: 2 });
    expect(getGlobalFusionMonitoringSnapshot().counters.warningSamples).toBeGreaterThan(0);
  });

  it("recordGlobalFusionWarning does not throw", () => {
    expect(() => recordGlobalFusionWarning("x")).not.toThrow();
  });

  it("snapshot values are finite and bounded 0–1 for rates", () => {
    recordGlobalFusionRun(baseResult());
    const s = getGlobalFusionMonitoringSnapshot();
    expect(Number.isFinite(s.fallbackRate)).toBe(true);
    expect(s.fallbackRate).toBeGreaterThanOrEqual(0);
    expect(s.fallbackRate).toBeLessThanOrEqual(1);
    expect(s.missingSourceRate).toBeLessThanOrEqual(1);
  });

  it("reset clears counters", () => {
    recordGlobalFusionRun(baseResult());
    expect(getGlobalFusionMonitoringSnapshot().runsTotal).toBe(1);
    resetGlobalFusionMonitoringForTests();
    expect(getGlobalFusionMonitoringSnapshot().runsTotal).toBe(0);
  });

  it("monitoring does not mutate input result", () => {
    const r = baseResult();
    const copy = JSON.stringify(r);
    recordGlobalFusionRun(r);
    expect(JSON.stringify(r)).toBe(copy);
  });

  it("tracks missing sources and high conflicts", () => {
    const r = baseResult();
    r.fusionPayload.meta.missingSources = ["brain"];
    r.fusionPayload.snapshot!.conflicts = [
      {
        id: "c1",
        systems: ["brain", "ads"],
        severity: "high",
        summary: "s",
        recommendation: "defer",
        detail: "d",
      },
    ];
    recordGlobalFusionRun(r);
    const s = getGlobalFusionMonitoringSnapshot();
    expect(s.counters.missingSourceRuns).toBe(1);
    expect(s.counters.highConflictRuns).toBe(1);
  });

  it("malformed and empty-output conditions increment counters", () => {
    const r = baseResult({
      path: "global_fusion_primary_fallback_default",
      primarySurfaceActive: false,
      validation: { ok: false, reasons: ["malformed_normalized_signals"] },
    });
    r.fusionPayload.meta.malformedNormalizedCount = 2;
    r.fusionPayload.snapshot!.opportunities = [];
    r.fusionPayload.snapshot!.recommendations = [];
    r.fusionPayload.snapshot!.risks = [];
    recordGlobalFusionRun(r);
    const s = getGlobalFusionMonitoringSnapshot();
    expect(s.counters.malformedInputRuns).toBe(1);
    expect(s.counters.emptyOutputRuns).toBe(1);
  });
});
