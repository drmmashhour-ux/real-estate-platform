import { describe, expect, it, beforeEach } from "vitest";
import { buildLeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.service";
import { resetLeadMonetizationControlMonitoringForTests } from "@/modules/leads/lead-monetization-control-monitoring.service";
import { computeLeadValueAndPrice } from "@/modules/revenue/lead-pricing.service";
import { computeDynamicLeadPrice } from "@/modules/leads/dynamic-pricing.service";
import { buildLeadMonetizationExplanation } from "@/modules/leads/lead-monetization-explainer.service";

describe("buildLeadMonetizationControlSummary", () => {
  beforeEach(() => {
    resetLeadMonetizationControlMonitoringForTests();
  });

  const baseLeadPricing = computeLeadValueAndPrice(
    { message: "buy home", score: 70, engagementScore: 40, interactionCount: 2, hasCompleteContact: true },
    {},
  );

  it("uses dynamic pricing as primary when present", () => {
    const dynamic = computeDynamicLeadPrice({
      leadId: "l1",
      basePrice: baseLeadPricing.leadPrice,
      qualityScore: 80,
      demandLevel: "high",
      brokerInterestLevel: 60,
    });
    const s = buildLeadMonetizationControlSummary({
      leadId: "l1",
      leadPricing: baseLeadPricing,
      leadQuality: {
        leadId: "l1",
        score: 80,
        band: "high",
        breakdown: {
          completenessScore: 70,
          intentScore: 70,
          budgetScore: 70,
          urgencyScore: 70,
          engagementScore: 70,
        },
        strongSignals: [],
        weakSignals: [],
        suggestedPrice: 55,
        createdAt: new Date().toISOString(),
      },
      dynamicPricing: dynamic,
      demandLevel: "high",
      demandScore: 80,
      brokerInterestLevel: 60,
      interactionCount: 4,
      regionPeerLeadCount: 2,
      conversionProbability: 0.2,
    });
    expect(s.priceSourceMode).toBe("dynamic_advisory");
    expect(s.suggestedPrice).toBe(dynamic.suggestedPrice);
    expect(s.explanation.toLowerCase()).toContain("dynamic");
  });

  it("falls back to quality advisory when dynamic absent", () => {
    const s = buildLeadMonetizationControlSummary({
      leadId: "l2",
      leadPricing: baseLeadPricing,
      leadQuality: {
        leadId: "l2",
        score: 75,
        band: "high",
        breakdown: {
          completenessScore: 70,
          intentScore: 70,
          budgetScore: 70,
          urgencyScore: 70,
          engagementScore: 70,
        },
        strongSignals: [],
        weakSignals: [],
        suggestedPrice: 48,
        createdAt: new Date().toISOString(),
      },
      dynamicPricing: undefined,
      demandLevel: "medium",
      demandScore: 40,
      brokerInterestLevel: 30,
      interactionCount: 0,
      regionPeerLeadCount: 0,
      conversionProbability: null,
    });
    expect(s.priceSourceMode).toBe("quality_advisory");
    expect(s.suggestedPrice).toBe(48);
  });

  it("marks low confidence with sparse signals", () => {
    const s = buildLeadMonetizationControlSummary({
      leadId: "l3",
      leadPricing: baseLeadPricing,
      leadQuality: undefined,
      dynamicPricing: undefined,
      demandLevel: "low",
      demandScore: 10,
      brokerInterestLevel: 20,
      interactionCount: 0,
      regionPeerLeadCount: 0,
      conversionProbability: null,
    });
    expect(s.priceSourceMode).toBe("base_only");
    expect(s.confidenceLevel).toBe("low");
    expect(s.missingSignals.length).toBeGreaterThan(0);
  });

  it("does not emit dynamic and quality as conflicting primary modes", () => {
    const dynamic = computeDynamicLeadPrice({
      leadId: "lx",
      basePrice: baseLeadPricing.leadPrice,
      qualityScore: 80,
      demandLevel: "high",
      brokerInterestLevel: 70,
    });
    const s = buildLeadMonetizationControlSummary({
      leadId: "lx",
      leadPricing: baseLeadPricing,
      leadQuality: {
        leadId: "lx",
        score: 80,
        band: "high",
        breakdown: {
          completenessScore: 70,
          intentScore: 70,
          budgetScore: 70,
          urgencyScore: 70,
          engagementScore: 70,
        },
        strongSignals: [],
        weakSignals: [],
        suggestedPrice: 44,
        createdAt: new Date().toISOString(),
      },
      dynamicPricing: dynamic,
      demandLevel: "high",
      demandScore: 70,
      brokerInterestLevel: 70,
      interactionCount: 5,
      regionPeerLeadCount: 2,
      conversionProbability: 0.15,
    });
    expect(s.priceSourceMode).toBe("dynamic_advisory");
    expect(s.suggestedPrice).toBe(dynamic.suggestedPrice);
    expect(s.explanation).not.toMatch(/quality model alone/i);
  });

  it("produces non-conflicting explanation for mode", () => {
    const exDyn = buildLeadMonetizationExplanation({
      mode: "dynamic_advisory",
      suggestedPrice: 90,
      basePrice: 40,
      confidenceLevel: "high",
    });
    const exQ = buildLeadMonetizationExplanation({
      mode: "quality_advisory",
      suggestedPrice: 50,
      basePrice: 40,
      confidenceLevel: "medium",
    });
    expect(exDyn).toContain("Suggested price (advisory)");
    expect(exQ).toContain("quality");
  });
});
