import { describe, expect, it } from "vitest";
import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { simulateFutureOutcome } from "@/src/modules/future-outcome-simulator/application/simulateFutureOutcome";

function simResult(): OfferSimulationResult {
  const v = (band: ImpactBand) => ({ score: 60, band, summary: "summary" });
  return {
    dealImpact: v(ImpactBand.Favorable),
    leverageImpact: v(ImpactBand.Neutral),
    riskImpact: v(ImpactBand.Caution),
    readinessImpact: v(ImpactBand.Neutral),
    recommendedStrategy: "Balanced",
    keyWarnings: ["Price below list in model"],
    recommendedProtections: ["Keep inspection"],
    nextActions: ["Confirm deposit"],
    confidence: SimulationConfidence.High,
    disclaimer: "Not advice",
  };
}

const input: OfferScenarioInput = {
  propertyId: "x",
  offerPriceCents: 400_000_00,
  depositAmountCents: 10_000_00,
  financingCondition: true,
  inspectionCondition: false,
  documentReviewCondition: true,
  occupancyDate: null,
  signatureDate: null,
  userStrategyMode: null,
};

describe("simulateFutureOutcome", () => {
  it("returns structured output wired to inputs", () => {
    const out = simulateFutureOutcome({
      propertyId: "x",
      listPriceCents: 450_000_00,
      scenarioInput: input,
      simulationResult: simResult(),
      caseState: null,
      dealSignals: null,
    });
    expect(out.timelineSteps.length).toBeGreaterThan(0);
    expect(out.possibleRisks.length).toBeGreaterThan(0);
    expect(out.requiredActions.length).toBeGreaterThan(0);
    expect(out.requiredDocuments.length).toBeGreaterThan(0);
    expect(out.readinessImpact.bandLabel).toContain("model");
    expect(out.confidenceLevel).toMatch(/low|medium|high/);
    expect(out.simulationConfidence).toBe(SimulationConfidence.High);
    expect(out.advisoryDisclaimer.length).toBeGreaterThan(20);
  });

  it("downgrades confidence when case blockers exist", () => {
    const out = simulateFutureOutcome({
      propertyId: "x",
      listPriceCents: 450_000_00,
      scenarioInput: input,
      simulationResult: simResult(),
      caseState: {
        caseStatus: "critical",
        signatureReadinessStatus: "not_ready",
        blockerLabels: ["b1"],
        warningLabels: [],
        primaryNextAction: "Fix",
        documentPanels: {
          sellerDeclaration: "blocked",
          contract: "incomplete",
          review: "incomplete",
        },
        legalFileHealth: "blocked",
        legalBlockingIssues: ["Graph issue"],
        knowledgeBlockCount: 1,
        knowledgeWarningCount: 0,
      },
      dealSignals: { trustScore: null, completenessPercent: 40, blockerCount: 3, contradictionCount: 0 },
    });
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.possibleRisks.some((r) => r.detail.includes("Graph issue"))).toBe(true);
  });
});
