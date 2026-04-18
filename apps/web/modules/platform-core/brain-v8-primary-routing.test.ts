import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import { resetBrainV8PrimaryMonitoringForTests } from "./brain-v8-primary-monitoring.service";

function outcome(
  id: string,
  decisionId: string,
  score: number,
  t: Date,
): BrainSnapshotPayload["recentOutcomes"][number] {
  return {
    id,
    decisionId,
    source: "ADS",
    entityType: "C",
    entityId: null,
    actionType: "a",
    outcomeType: "POSITIVE",
    outcomeScore: score,
    observedMetrics: null,
    reason: `r-${decisionId}`,
    createdAt: t,
  };
}

function strongSnapshot(): BrainSnapshotPayload {
  const t = new Date();
  return {
    weights: [],
    strongestSources: [],
    weakestSources: [],
    notes: [],
    warnings: [],
    lastLearningRun: null,
    timeline: [],
    v3: null,
    recentOutcomes: [
      outcome("o1", "d1", 0.4, t),
      outcome("o2", "d2", 0.4, t),
      outcome("o3", "d3", 0.4, t),
      outcome("o4", "d4", 0.4, t),
    ],
  };
}

describe("buildBrainOutputWithV8Routing", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    resetBrainV8PrimaryMonitoringForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it("primary OFF: delegates to Phase C overlay only (no duplicate influence)", async () => {
    delete process.env.FEATURE_BRAIN_V8_PRIMARY_V1;
    const inf = await import("./brain-v8-influence.service");
    const overlaySpy = vi.spyOn(inf, "applyBrainV8PresentationOverlay").mockImplementation((s) => ({ ...s }));
    const { buildBrainOutputWithV8Routing } = await import("./brain-v8-primary-routing.service");
    const snap = strongSnapshot();
    buildBrainOutputWithV8Routing(snap);
    expect(overlaySpy).toHaveBeenCalledTimes(1);
    expect(overlaySpy).toHaveBeenCalledWith(snap);
  });

  it("primary ON + strong comparison: uses primary path (no throw)", async () => {
    process.env.FEATURE_BRAIN_V8_PRIMARY_V1 = "1";
    const { buildBrainOutputWithV8Routing } = await import("./brain-v8-primary-routing.service");
    const snap = strongSnapshot();
    const out = buildBrainOutputWithV8Routing(snap);
    expect(out.recentOutcomes.length).toBe(snap.recentOutcomes.length);
    expect(out.brainV8Influence).toBeDefined();
  });

  it("primary ON + empty outcomes: falls back without throwing", async () => {
    process.env.FEATURE_BRAIN_V8_PRIMARY_V1 = "1";
    const { buildBrainOutputWithV8Routing } = await import("./brain-v8-primary-routing.service");
    const snap: BrainSnapshotPayload = {
      ...strongSnapshot(),
      recentOutcomes: [],
    };
    const out = buildBrainOutputWithV8Routing(snap);
    expect(out.recentOutcomes.length).toBe(0);
  });
});
