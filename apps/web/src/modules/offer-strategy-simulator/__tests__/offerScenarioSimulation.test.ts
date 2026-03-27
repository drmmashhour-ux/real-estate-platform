import { describe, expect, it } from "vitest";
import { runOfferScenarioSimulation } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioEngine";
import { compareOfferScenarios } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioComparisonService";
import { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import { softenStrategyLine } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioPolicyService";
import type { ListingSimulationContext, OfferScenarioInput } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

const baseCtx = (): ListingSimulationContext => ({
  propertyId: "p1",
  listPriceCents: 500_000_00,
  riskScore: 40,
  trustScore: 60,
  completenessPercent: 95,
  blockerCount: 0,
  warningCount: 0,
  contradictionCount: 0,
});

function input(over: Partial<OfferScenarioInput> = {}): OfferScenarioInput {
  return {
    propertyId: "p1",
    offerPriceCents: 500_000_00,
    depositAmountCents: 25_000_00,
    financingCondition: true,
    inspectionCondition: true,
    documentReviewCondition: true,
    occupancyDate: null,
    signatureDate: null,
    userStrategyMode: null,
    ...over,
  };
}

describe("runOfferScenarioSimulation", () => {
  it("keeps advisory disclaimer and bounded scores", () => {
    const r = runOfferScenarioSimulation(input(), baseCtx());
    expect(r.disclaimer.toLowerCase()).toMatch(/advisory|not legal/);
    expect(r.dealImpact.score).toBeGreaterThanOrEqual(0);
    expect(r.dealImpact.score).toBeLessThanOrEqual(100);
  });

  it("adds warnings when legal graph blockers exist", () => {
    const ctx = { ...baseCtx(), blockerCount: 2 };
    const r = runOfferScenarioSimulation(input(), ctx);
    expect(r.keyWarnings.some((w) => w.toLowerCase().includes("blocking"))).toBe(true);
  });

  it("flags low disclosure completeness with a warning", () => {
    const ctx = { ...baseCtx(), completenessPercent: 70 };
    const r = runOfferScenarioSimulation(input(), ctx);
    expect(r.keyWarnings.some((w) => w.toLowerCase().includes("disclosure"))).toBe(true);
  });
});

describe("softenStrategyLine", () => {
  it("softens output when confidence is low", () => {
    const line = softenStrategyLine(SimulationConfidence.Low, "Balanced approach.");
    expect(line).toContain("Uncertainty");
  });
});

describe("compareOfferScenarios", () => {
  it("picks lexicographic id when modeled risk ties", () => {
    const ctx = baseCtx();
    const mk = (id: string, ratio: number) => ({
      id,
      label: id,
      input: input({ offerPriceCents: Math.round(ctx.listPriceCents * ratio) }),
    });
    const out = compareOfferScenarios([mk("z", 0.99), mk("a", 0.99), mk("m", 0.99)], ctx);
    expect(out.bestRiskAdjustedScenarioId).toBe("a");
    expect(out.saferScenarioId).toBe("a");
  });
});
