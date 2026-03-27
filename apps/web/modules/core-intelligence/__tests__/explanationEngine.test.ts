import { describe, expect, it } from "vitest";
import { buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";
import { buildExplanation } from "@/src/core/intelligence/explanation/explanationEngine";

describe("explanationEngine", () => {
  it("produces explanation from real signal values", () => {
    const signals = buildListingSignals({ priceCents: 50000000, trustScore: 65, riskScore: 30, freshnessDays: 1, rentalDemand: 78 });
    const explanation = buildExplanation({
      signals,
      selection: [{ id: "1", type: "action", score: 70, confidence: 66, reasons: ["x"], recommendedAction: "analyze_more" }],
    });

    expect(explanation.short).toContain("deterministic");
    expect(explanation.keyFactors.length).toBeGreaterThan(0);
    expect(explanation.recommendedAction).toBe("analyze_more");
  });
});
