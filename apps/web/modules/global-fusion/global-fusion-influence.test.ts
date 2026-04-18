import { describe, expect, it, beforeEach, vi } from "vitest";
import type { ApplyGlobalFusionInfluenceInput } from "./global-fusion-influence.service";
import { applyGlobalFusionInfluence } from "./global-fusion-influence.service";
import type { GlobalFusionConflict, GlobalFusionNormalizedSignal } from "./global-fusion.types";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionInfluenceV1: false,
    },
  };
});

import { globalFusionFlags } from "@/config/feature-flags";

function baseSignal(over: Partial<GlobalFusionNormalizedSignal> = {}): GlobalFusionNormalizedSignal {
  return {
    id: "brain:1",
    source: "brain",
    targetType: "subsystem",
    targetId: "x",
    confidence: 0.75,
    priority: 0.7,
    risk: 0.35,
    evidenceQuality: 0.55,
    recommendationType: "test",
    reason: [],
    blockers: [],
    metrics: {},
    timestamp: new Date().toISOString(),
    freshnessMs: 100,
    provenance: "test",
    ...over,
  };
}

function baseInput(over: Partial<ApplyGlobalFusionInfluenceInput> = {}): ApplyGlobalFusionInfluenceInput {
  const scores = {
    fusedConfidence: 0.65,
    fusedPriority: 0.6,
    fusedRisk: 0.35,
    actionability: 0.55,
    agreementScore: 0.72,
    evidenceScore: 0.52,
  };
  return {
    opportunities: [
      {
        id: "o1",
        title: "A",
        systems: ["brain"],
        confidence: 0.7,
        rationale: "r",
      },
      {
        id: "o2",
        title: "B",
        systems: ["ads"],
        confidence: 0.65,
        rationale: "r",
      },
    ],
    risks: [
      {
        id: "r1",
        title: "risk",
        systems: ["cro"],
        severity: "medium",
        rationale: "r",
      },
    ],
    recommendations: [
      {
        id: "gf:rec:0",
        kind: "monitor_only",
        title: "m",
        why: "w",
        systemsAgreed: [],
        systemsDisagreed: [],
        confidenceSummary: "",
        riskSummary: "",
        evidenceSummary: "",
      },
    ],
    signals: [baseSignal(), baseSignal({ id: "ads:1", source: "ads" })],
    scores,
    conflicts: [],
    mergedMissingSources: [],
    malformedWarnings: [],
    contributingSystemsCount: 2,
    ...over,
  };
}

describe("applyGlobalFusionInfluence", () => {
  beforeEach(() => {
    (globalFusionFlags as { globalFusionInfluenceV1: boolean }).globalFusionInfluenceV1 = true;
  });

  it("flag off returns skipped and does not add presentation fields beyond clone", () => {
    (globalFusionFlags as { globalFusionInfluenceV1: boolean }).globalFusionInfluenceV1 = false;
    const input = baseInput();
    const inputJson = JSON.stringify(input);
    const out = applyGlobalFusionInfluence(input);
    expect(out.result.skipped).toBe(true);
    expect(out.result.applied).toBe(false);
    expect(out.result.gate.tier).toBe("blocked");
    expect(JSON.stringify(input)).toBe(inputJson);
  });

  it("strong agreement yields bounded priority delta", () => {
    const out = applyGlobalFusionInfluence(baseInput());
    expect(out.result.gate.tier).toBe("strong");
    expect(out.result.applied).toBe(true);
    const deltas = out.result.adjustments
      .filter((a) => a.targetKind === "opportunity")
      .map((a) => a.deltaPriority);
    for (const d of deltas) {
      expect(Math.abs(d)).toBeLessThanOrEqual(0.15);
    }
    const priors = out.opportunities.map((o) => o.displayPriority ?? 0);
    expect(Math.max(...priors) - Math.min(...priors)).toBeLessThanOrEqual(0.35);
  });

  it("high fused risk and conflicts add caution-oriented tags", () => {
    const conflict: GlobalFusionConflict = {
      id: "c1",
      systems: ["brain", "ads"],
      severity: "high",
      summary: "s",
      recommendation: "defer",
      detail: "d",
    };
    const out = applyGlobalFusionInfluence(
      baseInput({
        scores: {
          fusedConfidence: 0.55,
          fusedPriority: 0.5,
          fusedRisk: 0.72,
          actionability: 0.4,
          agreementScore: 0.4,
          evidenceScore: 0.5,
        },
        conflicts: [conflict],
      }),
    );
    expect(out.opportunities.some((o) => (o.influenceTags ?? []).includes("caution") || (o.influenceTags ?? []).includes("defer"))).toBe(
      true,
    );
  });

  it("malformed signals skip influence (blocked gate)", () => {
    const out = applyGlobalFusionInfluence(
      baseInput({
        malformedWarnings: ["bad"],
        signals: [baseSignal()],
      }),
    );
    expect(out.result.skipped).toBe(true);
    expect(out.result.gate.tier).toBe("blocked");
  });

  it("does not change item counts", () => {
    const input = baseInput();
    const out = applyGlobalFusionInfluence(input);
    expect(out.opportunities.length).toBe(input.opportunities.length);
    expect(out.risks.length).toBe(input.risks.length);
    expect(out.recommendations.length).toBe(input.recommendations.length);
  });

  it("weak coverage uses weak tier and avoids strong-tier boosts", () => {
    const out = applyGlobalFusionInfluence(
      baseInput({
        mergedMissingSources: ["brain", "ads", "cro"],
        scores: {
          ...baseInput().scores,
          evidenceScore: 0.25,
        },
      }),
    );
    expect(out.result.gate.tier).toBe("weak");
    expect(out.result.reasons[0]?.code).toBe("weak_tier");
    expect(out.result.metrics.boostedCount).toBe(0);
  });

  it("gate summary explains skip when blocked", () => {
    const out = applyGlobalFusionInfluence(
      baseInput({
        malformedWarnings: ["x"],
        signals: [],
      }),
    );
    expect(out.result.skipped).toBe(true);
    expect(out.result.gate.tier).toBe("blocked");
    expect(out.result.reasons.some((r) => r.code === "gate_blocked")).toBe(true);
  });

  it("low-evidence path tags monitor_only on weak tier", () => {
    const out = applyGlobalFusionInfluence(
      baseInput({
        mergedMissingSources: ["a", "b", "c"],
      }),
    );
    expect(out.opportunities.every((o) => (o.influenceTags ?? []).includes("monitor_only"))).toBe(true);
  });
});
