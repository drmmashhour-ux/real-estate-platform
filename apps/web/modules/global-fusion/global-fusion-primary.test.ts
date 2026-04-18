import { describe, expect, it, beforeEach, vi } from "vitest";

const buildGlobalFusionPayloadMock = vi.fn();

vi.mock("./global-fusion.service", () => ({
  buildGlobalFusionPayload: (...args: unknown[]) => buildGlobalFusionPayloadMock(...args),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionV1: true,
      globalFusionInfluenceV1: false,
      globalFusionPrimaryV1: false,
    },
  };
});

import { globalFusionFlags } from "@/config/feature-flags";
import { resetGlobalFusionMonitoringForTests } from "./global-fusion-monitoring.service";
import { buildGlobalFusionPrimarySurface } from "./global-fusion-primary.service";
import type { GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";

function minimalSnapshot(over: Partial<GlobalFusionSnapshot> = {}): GlobalFusionSnapshot {
  const base: GlobalFusionSnapshot = {
    generatedAt: new Date().toISOString(),
    opportunities: [
      {
        id: "o1",
        title: "O",
        systems: ["brain"],
        confidence: 0.7,
        rationale: "p",
      },
    ],
    risks: [
      {
        id: "r1",
        title: "R",
        systems: ["cro"],
        severity: "medium",
        rationale: "x",
      },
    ],
    recommendations: [
      {
        id: "gf:rec:0",
        kind: "monitor_only",
        title: "M",
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
      fusedConfidence: 0.6,
      fusedPriority: 0.55,
      fusedRisk: 0.4,
      actionability: 0.5,
      agreementScore: 0.65,
      evidenceScore: 0.5,
    },
    signals: [
      {
        id: "a:1",
        source: "brain",
        targetType: "subsystem",
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
        id: "b:1",
        source: "ads",
        targetType: "subsystem",
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
    ...over,
  };
  return base;
}

function enabledPayload(snap: GlobalFusionSnapshot, meta: Partial<GlobalFusionPayload["meta"]> = {}): GlobalFusionPayload {
  return {
    enabled: true,
    snapshot: snap,
    health: {
      overallStatus: "ok",
      observationalWarnings: [],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
    },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain", "ads", "global_fusion:v1"],
      missingSources: [],
      contributingSystemsCount: 2,
      normalizedSignalCount: 2,
      conflictCount: 0,
      recommendationCount: 1,
      persistenceLogged: false,
      influenceFlag: false,
      primaryFlag: globalFusionFlags.globalFusionPrimaryV1,
      influenceApplied: false,
      malformedNormalizedCount: 0,
      ...meta,
    },
  };
}

describe("buildGlobalFusionPrimarySurface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalFusionMonitoringForTests();
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = false;
    buildGlobalFusionPayloadMock.mockResolvedValue(enabledPayload(minimalSnapshot()));
  });

  it("primary flag off → source_advisory_default, no surface", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = false;
    const snap = minimalSnapshot();
    const before = JSON.stringify(snap);
    buildGlobalFusionPayloadMock.mockResolvedValue(enabledPayload(snap));
    const r = await buildGlobalFusionPrimarySurface({});
    expect(r.path).toBe("source_advisory_default");
    expect(r.primarySurfaceActive).toBe(false);
    expect(r.surface).toBeNull();
    expect(JSON.stringify(r.fusionPayload.snapshot)).toBe(before);
  });

  it("primary on + valid fusion → global_fusion_primary surface", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockResolvedValue(enabledPayload(minimalSnapshot()));
    const r = await buildGlobalFusionPrimarySurface({});
    expect(r.path).toBe("global_fusion_primary");
    expect(r.primarySurfaceActive).toBe(true);
    expect(r.surface).not.toBeNull();
    expect(r.surface!.groupedBy.proceed.length + r.surface!.groupedBy.proceed_with_caution.length).toBeGreaterThan(0);
    expect(buildGlobalFusionPayloadMock).toHaveBeenCalledTimes(1);
  });

  it("primary on + malformed signals → fallback", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockResolvedValue(
      enabledPayload(minimalSnapshot(), { malformedNormalizedCount: 2 }),
    );
    const r = await buildGlobalFusionPrimarySurface({});
    expect(r.path).toBe("global_fusion_primary_fallback_default");
    expect(r.primarySurfaceActive).toBe(false);
    expect(r.surface).toBeNull();
  });

  it("primary on + weak subsystem coverage → fallback", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockResolvedValue(
      enabledPayload(minimalSnapshot(), { contributingSystemsCount: 1 }),
    );
    const r = await buildGlobalFusionPrimarySurface({});
    expect(r.path).toBe("global_fusion_primary_fallback_default");
    expect(r.validation.ok).toBe(false);
  });

  it("assembly throw → fallback with assembly observational warning", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockRejectedValue(new Error("boom"));
    const r = await buildGlobalFusionPrimarySurface({});
    expect(r.path).toBe("global_fusion_primary_fallback_default");
    expect(r.observationalWarnings).toContain("assembly_error");
  });

  it("preserves provenance on surface items", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockResolvedValue(enabledPayload(minimalSnapshot()));
    const r = await buildGlobalFusionPrimarySurface({});
    const items = [
      ...r.surface!.groupedBy.proceed,
      ...r.surface!.groupedBy.proceed_with_caution,
      ...r.surface!.groupedBy.monitor_only,
    ];
    expect(items.every((i) => i.provenanceSystems.length > 0)).toBe(true);
  });

  it("does not call buildGlobalFusionPayload more than once (no double influence path)", async () => {
    (globalFusionFlags as { globalFusionPrimaryV1: boolean }).globalFusionPrimaryV1 = true;
    buildGlobalFusionPayloadMock.mockResolvedValue(enabledPayload(minimalSnapshot()));
    await buildGlobalFusionPrimarySurface({});
    expect(buildGlobalFusionPayloadMock).toHaveBeenCalledTimes(1);
  });
});
