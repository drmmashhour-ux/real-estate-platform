import { describe, expect, it } from "vitest";
import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import {
  filterPresentationWarnings,
  formatMoneyCents,
  primaryNextStep,
  presentationStrategyLine,
  presentationSummaryLines,
  riskLevelLabel,
  readinessStatusLabel,
} from "@/src/modules/offer-strategy-simulator/ui/simulatorPresentationCopy";

const baseVector = { score: 50, band: ImpactBand.Neutral, summary: "x" };

function mockResult(over: Partial<OfferSimulationResult> = {}): OfferSimulationResult {
  return {
    dealImpact: baseVector,
    leverageImpact: baseVector,
    riskImpact: baseVector,
    readinessImpact: baseVector,
    recommendedStrategy: "Balanced path. (Verify details with your broker before relying on this illustration.)",
    keyWarnings: ["Legal graph: 1 blocking issue on file — clarify before firming."],
    recommendedProtections: ["Keep financing dates aligned."],
    nextActions: ["Confirm numbers with your broker."],
    confidence: SimulationConfidence.High,
    disclaimer: "Advisory only.",
    ...over,
  };
}

describe("simulatorPresentationCopy", () => {
  it("uses plain-language risk labels without scores", () => {
    expect(riskLevelLabel(ImpactBand.Favorable)).not.toMatch(/\d/);
    expect(readinessStatusLabel(ImpactBand.Favorable)).not.toMatch(/score/i);
  });

  it("strips internal parentheticals from presentation strategy line", () => {
    const line = presentationStrategyLine(mockResult());
    expect(line).not.toContain("Verify details");
  });

  it("keeps presentation summaries short", () => {
    const lines = presentationSummaryLines(mockResult());
    expect(lines.length).toBeLessThanOrEqual(3);
    lines.forEach((l) => expect(l.length).toBeLessThan(400));
  });

  it("softens strategy when confidence is low", () => {
    const line = presentationStrategyLine(
      mockResult({
        confidence: SimulationConfidence.Low,
        recommendedStrategy: "Test.",
      }),
    );
    expect(line.toLowerCase()).toMatch(/conversation starter/);
  });

  it("rewrites jargon in presentation warnings", () => {
    const out = filterPresentationWarnings(["Legal graph: 2 blocking issues"]);
    expect(out[0]).not.toContain("Legal graph");
  });

  it("primaryNextStep prefers first action", () => {
    expect(primaryNextStep(mockResult())).toContain("broker");
  });

  it("formatMoneyCents is readable", () => {
    expect(formatMoneyCents(500_000_00)).toMatch(/\$/);
  });
});
