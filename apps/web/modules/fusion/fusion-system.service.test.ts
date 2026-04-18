import { describe, expect, it } from "vitest";
import { mergeFusionGatherForTests } from "./fusion-system.gather";
import { normalizeFusionSignals } from "./fusion-system.normalization";
import { detectFusionConflicts } from "./fusion-system.conflicts";
import { computeFusionScores } from "./fusion-system.scoring";
import { buildFusionAdvisoryRecommendations } from "./fusion-system.recommendations";
import { buildFusionHealthSummary } from "./fusion-system.health";
import type { FusionNormalizedSignal } from "./fusion-system.types";

describe("Fusion normalization", () => {
  it("does not mutate raw gather inputs", async () => {
    const raw = mergeFusionGatherForTests({
      adsMonitoring: {
        totalRuns: 1,
        legacyPathRuns: 0,
        v8RolloutPathRuns: 1,
        shadowScheduleInvocations: 0,
        shadowPipelineCompletions: 0,
        shadowPipelineFailures: 0,
        shadowPersistenceSuccess: 0,
        shadowPersistenceFailures: 0,
        v8PrimarySuccessCount: 0,
        v8PrimaryFallbackCount: 3,
        recentPrimaryFallbackReasons: ["x"],
        lastPrimaryPathLabel: "v8_primary_fallback_legacy",
      },
    });
    const copy = JSON.parse(JSON.stringify(raw.adsMonitoring));
    normalizeFusionSignals(raw);
    expect(raw.adsMonitoring).toEqual(copy);
  });

  it("tolerates empty operator and platform lists", () => {
    const raw = mergeFusionGatherForTests({
      operatorRecommendations: [],
      platformDecisions: [],
    });
    const sigs = normalizeFusionSignals(raw);
    expect(sigs.some((s) => s.source === "ads")).toBe(true);
  });
});

describe("Fusion scoring bounds", () => {
  it("returns finite bounded scores", () => {
    const signals: FusionNormalizedSignal[] = [
      {
        id: "a",
        source: "brain",
        kind: "k",
        confidence: 0.8,
        priority: 0.7,
        risk: 0.2,
        evidenceQuality: 0.6,
        reasons: [],
      },
      {
        id: "b",
        source: "ads",
        kind: "k",
        confidence: 0.5,
        priority: 0.4,
        risk: 0.5,
        evidenceQuality: 0.5,
        reasons: [],
      },
    ];
    const scores = computeFusionScores(signals, []);
    expect(Number.isFinite(scores.fusedConfidence)).toBe(true);
    expect(scores.fusedConfidence).toBeGreaterThanOrEqual(0);
    expect(scores.fusedConfidence).toBeLessThanOrEqual(1);
    expect(scores.fusedReadiness).toBeLessThanOrEqual(1);
  });
});

describe("Fusion conflicts", () => {
  it("detects brain vs ads tension", () => {
    const raw = mergeFusionGatherForTests({});
    const signals: FusionNormalizedSignal[] = [
      { id: "1", source: "brain", kind: "x", trust: 0.9, reasons: [] },
      { id: "2", source: "ads", kind: "y", risk: 0.8, reasons: [] },
    ];
    const c = detectFusionConflicts(signals, raw);
    expect(c.some((x) => x.category === "trust_vs_ads_risk")).toBe(true);
  });
});

describe("Fusion recommendations", () => {
  it("produces advisory kinds without execution semantics", () => {
    const signals: FusionNormalizedSignal[] = [
      {
        id: "1",
        source: "brain",
        kind: "k",
        confidence: 0.9,
        reasons: [],
      },
    ];
    const conflicts = detectFusionConflicts(signals, mergeFusionGatherForTests({}));
    const scores = computeFusionScores(signals, conflicts);
    const recs = buildFusionAdvisoryRecommendations(signals, conflicts, scores);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => typeof r.kind === "string")).toBe(true);
  });
});

describe("Fusion health", () => {
  it("includes observational warnings for empty fusion with many subsystems implied", () => {
    const raw = mergeFusionGatherForTests({ gatherWarnings: ["partial"] });
    const health = buildFusionHealthSummary([], [], [], raw);
    expect(health.observationalWarnings.length).toBeGreaterThan(0);
  });

  it("warns on malformed normalized signals (non-finite scores)", () => {
    const bad: FusionNormalizedSignal[] = [
      { id: "x", source: "ads", kind: "k", confidence: Number.NaN, reasons: [] },
    ];
    const health = buildFusionHealthSummary(bad, [], [], mergeFusionGatherForTests({}));
    expect(health.observationalWarnings.some((w) => w.includes("malformed"))).toBe(true);
  });
});

