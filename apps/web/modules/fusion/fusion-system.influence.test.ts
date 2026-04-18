import { describe, expect, it, vi, afterEach } from "vitest";
import type { FusionSnapshot } from "./fusion-system.types";

const baseSnapshot = (): FusionSnapshot => ({
  generatedAt: "",
  scores: {
    fusedConfidence: 0.5,
    fusedPriority: 0.5,
    fusedRisk: 0.2,
    fusedReadiness: 0.6,
    agreementScore: 0.7,
    evidenceQuality: 0.5,
    actionabilityScore: 0.5,
  },
  signals: [],
  conflicts: [],
  recommendations: [
    {
      kind: "monitor_only",
      title: "t",
      detail: "d",
      agreeingSystems: ["brain"],
      disagreeingSystems: [],
      keyRisks: [],
    },
  ],
  comparisonSummary: { overlapEntityCount: 0, divergentPriorityCount: 0, notes: [] },
  health: {
    subsystemsAvailable: 1,
    subsystemsTotal: 4,
    normalizedSignalCount: 1,
    agreementPairsApprox: 0,
    disagreementPairsApprox: 0,
    conflictCount: 0,
    conflictByCategory: {},
    recommendationsByKind: { monitor_only: 1 },
    insufficientEvidenceRate: 0,
    observationalWarnings: [],
  },
  influenceOverlay: null,
  persistenceId: null,
});

describe("buildFusionInfluenceOverlay", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it("returns null when FEATURE_FUSION_SYSTEM_INFLUENCE_V1 is unset/false", async () => {
    delete process.env.FEATURE_FUSION_SYSTEM_INFLUENCE_V1;
    const { buildFusionInfluenceOverlay } = await import("./fusion-system.influence");
    expect(buildFusionInfluenceOverlay(baseSnapshot())).toBeNull();
  });

  it("returns overlay shape when influence flag is on", async () => {
    process.env.FEATURE_FUSION_SYSTEM_INFLUENCE_V1 = "1";
    const { buildFusionInfluenceOverlay } = await import("./fusion-system.influence");
    const o = buildFusionInfluenceOverlay(baseSnapshot());
    expect(o).not.toBeNull();
    expect(o?.tagsByTarget).toBeDefined();
  });
});
