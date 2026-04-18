import { describe, it, expect } from "vitest";
import { classifyDecisionOutcome } from "./brain-outcome-evaluator.service";

describe("brain-outcome-evaluator.service", () => {
  it("classifies positive when metrics improve", () => {
    const r = classifyDecisionOutcome({
      decisionId: "d1",
      source: "ADS",
      entityType: "CAMPAIGN",
      actionType: "SCALE",
      beforeMetrics: { conversionRate: 0.1, ctr: 0.01, profitPerLead: 1 },
      afterMetrics: { conversionRate: 0.5, ctr: 0.02, profitPerLead: 2 },
    });
    expect(r.outcomeType).toBe("POSITIVE");
    expect(r.outcomeScore).toBeGreaterThan(0.02);
  });

  it("classifies negative when metrics decline", () => {
    const r = classifyDecisionOutcome({
      decisionId: "d2",
      source: "CRO",
      entityType: "LISTING",
      actionType: "TWEAK",
      beforeMetrics: { conversionRate: 0.5, ctr: 0.05, profitPerLead: 3 },
      afterMetrics: { conversionRate: 0.1, ctr: 0.01, profitPerLead: 1 },
    });
    expect(r.outcomeType).toBe("NEGATIVE");
    expect(r.outcomeScore).toBeLessThan(-0.02);
  });

  it("classifies insufficient data without deltas", () => {
    const r = classifyDecisionOutcome({
      decisionId: "d3",
      source: "MARKETPLACE",
      entityType: "LISTING",
      actionType: "BOOST",
      beforeMetrics: null,
      afterMetrics: null,
    });
    expect(r.outcomeType).toBe("INSUFFICIENT_DATA");
  });
});
