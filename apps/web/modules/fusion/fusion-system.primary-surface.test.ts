import { describe, expect, it, vi, beforeEach } from "vitest";
import type { FusionSnapshot } from "./fusion-system.types";

const fusionTestFlags = vi.hoisted(() => ({
  primary: false,
  orchestration: true,
}));

const buildFusionSnapshotV1Mock = vi.hoisted(() => vi.fn<[], Promise<FusionSnapshot | null>>());

vi.mock("@/config/feature-flags", () => ({
  fusionSystemFlags: {
    fusionSystemV1: true,
    fusionSystemShadowV1: true,
    fusionSystemPersistenceV1: false,
    fusionSystemInfluenceV1: false,
    get fusionSystemPrimaryV1() {
      return fusionTestFlags.primary;
    },
  },
  isFusionOrchestrationActive: () => fusionTestFlags.orchestration,
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("./fusion-system.service", () => ({
  buildFusionSnapshotV1: () => buildFusionSnapshotV1Mock(),
}));

import {
  buildFusionPrimarySurface,
  buildPrimaryPresentationFromSnapshot,
  resetFusionPrimarySurfaceSessionForTests,
  validateFusionPrimaryReadiness,
} from "./fusion-system.primary-surface";

function baseScore() {
  return {
    fusedConfidence: 0.7,
    fusedPriority: 0.6,
    fusedRisk: 0.3,
    fusedReadiness: 0.65,
    agreementScore: 0.72,
    evidenceQuality: 0.6,
    actionabilityScore: 0.55,
  };
}

function minimalSnapshot(over: Partial<FusionSnapshot> = {}): FusionSnapshot {
  const signals = over.signals ?? [
    { id: "a", source: "brain" as const, kind: "k", reasons: [] },
    { id: "b", source: "ads" as const, kind: "k", reasons: [] },
  ];
  const recommendations =
    over.recommendations ??
    ([
      {
        kind: "proceed" as const,
        title: "t1",
        detail: "d",
        agreeingSystems: ["brain" as const],
        disagreeingSystems: [],
        keyRisks: [],
      },
    ] as FusionSnapshot["recommendations"]);
  return {
    generatedAt: new Date().toISOString(),
    scores: over.scores ?? baseScore(),
    signals,
    conflicts: over.conflicts ?? [],
    recommendations,
    comparisonSummary: over.comparisonSummary ?? { overlapEntityCount: 0, divergentPriorityCount: 0, notes: [] },
    health:
      over.health ??
      ({
        subsystemsAvailable: 2,
        subsystemsTotal: 4,
        normalizedSignalCount: signals.length,
        agreementPairsApprox: 1,
        disagreementPairsApprox: 0,
        conflictCount: 0,
        conflictByCategory: {},
        recommendationsByKind: { proceed: 1 },
        insufficientEvidenceRate: 0,
        observationalWarnings: [],
      } as FusionSnapshot["health"]),
    influenceOverlay: over.influenceOverlay ?? null,
    ...over,
  };
}

describe("validateFusionPrimaryReadiness", () => {
  it("rejects non-finite scores", () => {
    const snap = minimalSnapshot({
      scores: { ...baseScore(), fusedConfidence: Number.NaN },
    });
    expect(validateFusionPrimaryReadiness(snap).ok).toBe(false);
  });

  it("rejects malformed signals", () => {
    const snap = minimalSnapshot({
      signals: [{ id: "", source: "brain", kind: "k", reasons: [] }],
    });
    expect(validateFusionPrimaryReadiness(snap).ok).toBe(false);
  });

  it("rejects empty recommendations when many signals", () => {
    const signals = Array.from({ length: 4 }, (_, i) => ({
      id: `s${i}`,
      source: "brain" as const,
      kind: "k",
      reasons: [] as string[],
    }));
    const snap = minimalSnapshot({ signals, recommendations: [] });
    expect(validateFusionPrimaryReadiness(snap).ok).toBe(false);
  });

  it("accepts a typical valid snapshot", () => {
    expect(validateFusionPrimaryReadiness(minimalSnapshot()).ok).toBe(true);
  });
});

describe("buildPrimaryPresentationFromSnapshot", () => {
  it("preserves recommendation objects and buckets by kind order", () => {
    const snap = minimalSnapshot({
      recommendations: [
        {
          kind: "defer",
          title: "d",
          detail: "",
          agreeingSystems: ["operator"],
          disagreeingSystems: [],
          keyRisks: [],
        },
        {
          kind: "proceed",
          title: "p",
          detail: "",
          agreeingSystems: ["brain"],
          disagreeingSystems: ["ads"],
          keyRisks: [],
        },
      ],
    });
    const pres = buildPrimaryPresentationFromSnapshot(snap);
    expect(pres.buckets.proceed[0].title).toBe("p");
    expect(pres.buckets.defer[0].title).toBe("d");
    expect(pres.rankedRecommendations.map((r) => r.kind)).toEqual(["proceed", "defer"]);
    expect(pres.contributingSystems.sort()).toEqual(["ads", "brain"].sort());
  });
});

describe("buildFusionPrimarySurface", () => {
  beforeEach(() => {
    resetFusionPrimarySurfaceSessionForTests();
    fusionTestFlags.primary = false;
    fusionTestFlags.orchestration = true;
    buildFusionSnapshotV1Mock.mockReset();
  });

  it("returns null snapshot when orchestration inactive", async () => {
    fusionTestFlags.orchestration = false;
    const r = await buildFusionPrimarySurface();
    expect(r.snapshot).toBeNull();
    expect(r.presentation).toBeNull();
  });

  it("primary flag OFF matches Phase B shape: snapshot, no presentation", async () => {
    fusionTestFlags.primary = false;
    const snap = minimalSnapshot();
    buildFusionSnapshotV1Mock.mockResolvedValue(snap);
    const r = await buildFusionPrimarySurface();
    expect(r.snapshot).toBe(snap);
    expect(r.presentation).toBeNull();
    expect(r.primaryPresentationActive).toBe(false);
    expect(r.fallbackUsed).toBe(false);
  });

  it("primary ON + valid snapshot returns fused presentation", async () => {
    fusionTestFlags.primary = true;
    buildFusionSnapshotV1Mock.mockResolvedValue(minimalSnapshot());
    const r = await buildFusionPrimarySurface();
    expect(r.primaryPresentationActive).toBe(true);
    expect(r.presentation?.rankedRecommendations.length).toBeGreaterThan(0);
    expect(r.presentation?.structured.recommendations.length).toBeGreaterThan(0);
    expect(r.presentation?.structured.meta.conflictCount).toBe(0);
    expect(r.presentation?.structured.meta.systemsUsed.length).toBeGreaterThan(0);
    expect(r.fallbackUsed).toBe(false);
  });

  it("structured items preserve provenance fields", () => {
    const snap = minimalSnapshot();
    const pres = buildPrimaryPresentationFromSnapshot(snap);
    const first = pres.structured.recommendations[0];
    expect(first.sourceSystems).toContain("brain");
    expect(first.reasons.length).toBeGreaterThan(0);
    expect(Number.isFinite(first.confidence)).toBe(true);
    expect(Number.isFinite(first.risk)).toBe(true);
    expect(pres.structured.groupedBy.proceed.length).toBeGreaterThan(0);
  });

  it("primary ON + validation failure keeps snapshot, no presentation", async () => {
    fusionTestFlags.primary = true;
    const bad = minimalSnapshot({
      scores: { ...baseScore(), agreementScore: Number.POSITIVE_INFINITY },
    });
    buildFusionSnapshotV1Mock.mockResolvedValue(bad);
    const r = await buildFusionPrimarySurface();
    expect(r.snapshot).toBe(bad);
    expect(r.presentation).toBeNull();
    expect(r.fallbackUsed).toBe(true);
    expect(r.fallbackReason).toBe("non_finite_scores");
  });

  it("build throw yields fallback without throwing", async () => {
    fusionTestFlags.primary = true;
    buildFusionSnapshotV1Mock.mockRejectedValue(new Error("boom"));
    const r = await buildFusionPrimarySurface();
    expect(r.snapshot).toBeNull();
    expect(r.fallbackUsed).toBe(true);
    expect(r.fallbackReason).toBe("fusion_build_throw");
  });

  it("does not mutate snapshot recommendations array order in snapshot", async () => {
    fusionTestFlags.primary = true;
    const recs = [
      {
        kind: "monitor_only" as const,
        title: "m",
        detail: "",
        agreeingSystems: [] as const,
        disagreeingSystems: [] as const,
        keyRisks: [] as string[],
      },
    ];
    const snap = minimalSnapshot({ recommendations: recs });
    buildFusionSnapshotV1Mock.mockResolvedValue(snap);
    await buildFusionPrimarySurface();
    expect(snap.recommendations).toBe(recs);
  });
});
