import { describe, expect, it } from "vitest";
import { computeRequiresApproval, estimateMagnitude, validatePayload } from "@/modules/autonomy/autonomy-decision.service";
import { generateDecisions, type AutonomyCycleResult } from "@/modules/autonomy/autonomy-engine.service";
import { SMALL_CHANGE_THRESHOLD, type AutonomyDecisionInputs } from "@/modules/autonomy/autonomy-types";

const baseInputs: AutonomyDecisionInputs = {
  baseline: {
    seniorConversionRate30d: 0.04,
    avgLeadScore: 36,
    leadVolume30d: 30,
    demandIndex: 0.56,
    matchingEventsTotal: 400,
  },
  leadRule: {
    basePrice: 49,
    minPrice: 29,
    maxPrice: 149,
    demandFactor: 0.92,
    qualityFactor: 1,
  },
  topByPerformance: [],
  lowVisibilityHighConverter: [
    { residenceId: "a", performanceScore: 72, views: 12, conversionRate: 0.08 },
    { residenceId: "b", performanceScore: 68, views: 14, conversionRate: 0.07 },
  ],
  gtmOnboardingEvents30d: 4,
};

describe("LECIPM autonomy guardrails", () => {
  it("requires approval for GROWTH always", () => {
    expect(computeRequiresApproval("GROWTH", 0.01)).toBe(true);
    expect(computeRequiresApproval("GROWTH", 1)).toBe(true);
  });

  it("uses 5% threshold for pricing/ranking/matching magnitude", () => {
    expect(computeRequiresApproval("PRICING", SMALL_CHANGE_THRESHOLD - 0.001)).toBe(false);
    expect(computeRequiresApproval("PRICING", SMALL_CHANGE_THRESHOLD)).toBe(true);
    expect(computeRequiresApproval("MATCHING", 0.03)).toBe(false);
  });

  it("rejects oversized destructive payload steps", () => {
    const bad = validatePayload({
      kind: "adjust_lead_base_price",
      relativeDelta: 0.2,
    });
    expect(bad.ok).toBe(false);
  });
});

describe("generateDecisions", () => {
  it("proposes decisions when signals show poor conversion / opportunity", () => {
    const drafts = generateDecisions(baseInputs);
    expect(drafts.length).toBeGreaterThan(0);

    const domains = new Set(drafts.map((d) => d.domain));
    expect(domains.has("MATCHING")).toBe(true);
    expect(domains.has("PRICING")).toBe(true);
    expect(domains.has("RANKING")).toBe(true);
    expect(domains.has("GROWTH")).toBe(true);

    for (const d of drafts) {
      const m = estimateMagnitude(d.payload);
      expect(Number.isFinite(m)).toBe(true);
      if (d.domain !== "GROWTH") {
        expect(validatePayload(d.payload).ok).toBe(true);
      }
    }
  });

  it("does not emit proposals when traffic is too thin", () => {
    const thin: AutonomyDecisionInputs = {
      ...baseInputs,
      baseline: {
        ...baseInputs.baseline,
        leadVolume30d: 4,
        matchingEventsTotal: 40,
      },
      lowVisibilityHighConverter: [],
    };
    const drafts = generateDecisions(thin);
    expect(drafts.length).toBe(0);
  });
});

describe("AutonomyCycleResult shape", () => {
  it("documents cycle output contract", () => {
    const sample: AutonomyCycleResult = {
      proposals: 2,
      persistedIds: ["x", "y"],
      autoApplied: 1,
      skippedDeduped: 0,
    };
    expect(sample.autoApplied).toBeLessThanOrEqual(sample.persistedIds.length);
  });
});
