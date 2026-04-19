import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeLeadPricingExperimentMode } from "@/modules/leads/lead-pricing-experiment-modes.service";
import {
  buildLeadPricingComparisonSummary,
  buildLeadPricingExperiments,
} from "@/modules/leads/lead-pricing-experiments.service";
import { resolveInternalLeadPricingDisplay } from "@/modules/leads/lead-pricing-display.service";
import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";
import { LEAD_DYNAMIC_PRICING_MAX_MULT } from "@/modules/leads/dynamic-pricing.service";
import { validateOverrideReason } from "@/modules/leads/lead-pricing-override.service";

function sampleMonetization(over: Partial<LeadMonetizationControlSummary> = {}): LeadMonetizationControlSummary {
  return {
    leadId: "lead_test",
    basePrice: 100,
    qualityBand: "high",
    qualityScore: 75,
    demandLevel: "medium",
    demandScore: 55,
    brokerInterestLevel: 50,
    suggestedPrice: 160,
    priceSourceMode: "dynamic_advisory",
    confidenceLevel: "medium",
    reasons: [],
    warnings: [],
    missingSignals: [],
    explanation: "test",
    ...over,
  };
}

describe("buildLeadPricingExperiments", () => {
  it("is deterministic for identical inputs", () => {
    const m = sampleMonetization();
    const a = buildLeadPricingExperiments({
      leadId: "x",
      basePrice: m.basePrice,
      monetization: m,
      quality: undefined,
      dynamic: undefined,
      historicalConversion: 0.2,
    });
    const b = buildLeadPricingExperiments({
      leadId: "x",
      basePrice: m.basePrice,
      monetization: m,
      quality: undefined,
      dynamic: undefined,
      historicalConversion: 0.2,
    });
    expect(a).toEqual(b);
  });

  it("keeps non-baseline modes within global advisory ceiling vs base", () => {
    const m = sampleMonetization({ basePrice: 200 });
    const rows = buildLeadPricingExperiments({
      leadId: "x",
      basePrice: m.basePrice,
      monetization: m,
      quality: undefined,
      dynamic: undefined,
    });
    for (const r of rows) {
      if (r.mode === "baseline") continue;
      if (r.mode === "conservative") {
        expect(r.suggestedPrice).toBeLessThanOrEqual(Math.ceil(m.basePrice * 1.35) + 1);
        continue;
      }
      expect(r.suggestedPrice).toBeLessThanOrEqual(m.basePrice * LEAD_DYNAMIC_PRICING_MAX_MULT + 1);
    }
  });

  it("propagates low-confidence warnings into experiment rows", () => {
    const m = sampleMonetization({ confidenceLevel: "low" });
    const rows = buildLeadPricingExperiments({
      leadId: "x",
      basePrice: m.basePrice,
      monetization: m,
      quality: undefined,
      dynamic: undefined,
    });
    const first = rows.find((r) => r.mode === "quality_weighted");
    expect(first?.warnings.some((w) => /low/i.test(w))).toBe(true);
  });
});

describe("computeLeadPricingExperimentMode", () => {
  it("explains quality vs demand weighting differently even when totals hit the same advisory cap", () => {
    const m = sampleMonetization();
    const q = computeLeadPricingExperimentMode("quality_weighted", {
      basePrice: m.basePrice,
      monetization: m,
    });
    const d = computeLeadPricingExperimentMode("demand_weighted", {
      basePrice: m.basePrice,
      monetization: m,
    });
    expect(q.reasons.some((t) => /quality layer/i.test(t))).toBe(true);
    expect(d.reasons.some((t) => /demand layer/i.test(t))).toBe(true);
  });
});

describe("resolveInternalLeadPricingDisplay", () => {
  it("prefers active operator override over monetization suggested", () => {
    const r = resolveInternalLeadPricingDisplay({
      basePrice: 100,
      monetizationSuggestedPrice: 180,
      activeOverride: {
        id: "o1",
        leadId: "l1",
        basePrice: 100,
        systemSuggestedPrice: 180,
        overridePrice: 220,
        reason: "strategic test",
        createdBy: "u1",
        createdAt: new Date().toISOString(),
        status: "active",
      },
    });
    expect(r.effectiveAdvisoryPrice).toBe(220);
    expect(r.precedence).toBe("operator_override");
  });

  it("falls back to monetization then base", () => {
    const mid = resolveInternalLeadPricingDisplay({
      basePrice: 100,
      monetizationSuggestedPrice: 165,
      activeOverride: null,
    });
    expect(mid.effectiveAdvisoryPrice).toBe(165);
    expect(mid.precedence).toBe("monetization_primary");

    const baseOnly = resolveInternalLeadPricingDisplay({
      basePrice: 100,
      monetizationSuggestedPrice: 100,
      activeOverride: null,
    });
    expect(baseOnly.effectiveAdvisoryPrice).toBe(100);
    expect(baseOnly.precedence).toBe("base_fallback");
  });
});

describe("buildLeadPricingComparisonSummary", () => {
  it("embeds display precedence from resolver", () => {
    const m = sampleMonetization();
    const experiments = buildLeadPricingExperiments({
      leadId: m.leadId,
      basePrice: m.basePrice,
      monetization: m,
      quality: undefined,
      dynamic: undefined,
    });
    const summary = buildLeadPricingComparisonSummary({
      leadId: m.leadId,
      monetization: m,
      experimentResults: experiments,
      activeOverride: null,
    });
    expect(summary.selectedDisplayMode).toBe("monetization_primary");
    expect(summary.experimentResults).toHaveLength(5);
  });
});

describe("validateOverrideReason", () => {
  it("requires a non-empty trimmed reason", () => {
    expect(validateOverrideReason("  ")).toBeNull();
    expect(validateOverrideReason("")).toBeNull();
    expect(validateOverrideReason(1)).toBeNull();
    expect(validateOverrideReason(" admin review decision ")).toBe("admin review decision");
  });
});

describe("safety: revenue engine isolation", () => {
  it("does not import operator overrides into lead-pricing.service (unlock engine)", () => {
    const root = join(process.cwd(), "modules/revenue/lead-pricing.service.ts");
    const src = readFileSync(root, "utf8");
    expect(src.toLowerCase()).not.toContain("pricingoverride");
    expect(src.toLowerCase()).not.toContain("lead_pricing_override");
  });
});
