import { describe, expect, it } from "vitest";
import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import type { FutureOutcomeCaseInput } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";
import {
  buildPossibleRisks,
  buildRequiredActions,
  buildTimelineSteps,
} from "@/src/modules/future-outcome-simulator/infrastructure/futureOutcomeEngine";

function baseInput(over: Partial<OfferScenarioInput> = {}): OfferScenarioInput {
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

function baseResult(over: Partial<OfferSimulationResult> = {}): OfferSimulationResult {
  const v = (band: ImpactBand) => ({ score: 50, band, summary: "s" });
  return {
    dealImpact: v(ImpactBand.Neutral),
    leverageImpact: v(ImpactBand.Neutral),
    riskImpact: v(ImpactBand.Neutral),
    readinessImpact: v(ImpactBand.Neutral),
    recommendedStrategy: "x",
    keyWarnings: [],
    recommendedProtections: [],
    nextActions: [],
    confidence: SimulationConfidence.Medium,
    disclaimer: "d",
    ...over,
  };
}

const minimalCase: FutureOutcomeCaseInput = {
  caseStatus: "attention",
  signatureReadinessStatus: "not_ready",
  blockerLabels: [],
  warningLabels: [],
  primaryNextAction: "Complete declarations.",
  documentPanels: {
    sellerDeclaration: "incomplete",
    contract: "incomplete",
    review: "incomplete",
  },
  legalFileHealth: "healthy",
  legalBlockingIssues: [],
  knowledgeBlockCount: 0,
  knowledgeWarningCount: 0,
};

describe("futureOutcomeEngine", () => {
  it("includes inspection and financing steps when conditions are on", () => {
    const steps = buildTimelineSteps(baseInput(), baseResult(), null);
    const titles = steps.map((s) => s.title);
    expect(titles.some((t) => t.includes("Inspection"))).toBe(true);
    expect(titles.some((t) => t.includes("Financing"))).toBe(true);
  });

  it("omits inspection step when condition off", () => {
    const steps = buildTimelineSteps(baseInput({ inspectionCondition: false }), baseResult(), null);
    expect(steps.some((s) => s.title.includes("Inspection"))).toBe(false);
  });

  it("adds case-file risks when blockers present", () => {
    const risks = buildPossibleRisks(
      baseInput(),
      baseResult(),
      { ...minimalCase, blockerLabels: ["Missing field X"] },
    );
    expect(risks.some((r) => r.detail.includes("Missing field X"))).toBe(true);
    expect(risks.every((r) => r.id.startsWith("rk-"))).toBe(true);
  });

  it("adds hedging risks when protections removed in scenario", () => {
    const risks = buildPossibleRisks(baseInput({ financingCondition: false, inspectionCondition: false }), baseResult(), null);
    expect(risks.some((r) => r.title.includes("Financing"))).toBe(true);
    expect(risks.some((r) => r.title.includes("Physical"))).toBe(true);
  });

  it("injects primary next action from case state into actions", () => {
    const actions = buildRequiredActions(baseInput(), minimalCase);
    expect(actions.some((a) => a.label.includes("Complete declarations."))).toBe(true);
  });

  it("does not invent arbitrary timeline labels — steps are from fixed catalog", () => {
    const steps = buildTimelineSteps(baseInput(), baseResult(), null);
    for (const s of steps) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.id).toMatch(/^tl-\d+$/);
    }
  });
});
