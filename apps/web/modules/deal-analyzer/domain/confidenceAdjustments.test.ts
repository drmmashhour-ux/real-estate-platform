import { describe, expect, it } from "vitest";
import { refineDealAnalysisConfidence } from "@/modules/deal-analyzer/domain/confidenceAdjustments";

describe("refineDealAnalysisConfidence", () => {
  const base = {
    baseLevel: "high" as const,
    investmentScore: 55,
    riskScore: 40,
    opportunityType: "buy_to_rent",
    comparablesConfidence: "high",
    comparableCount: 8,
    analysisUpdatedAt: new Date(),
    scenarioModes: ["rental"],
  };

  it("downgrades when comps are weak", () => {
    const r = refineDealAnalysisConfidence({
      ...base,
      comparablesConfidence: "low",
      comparableCount: 2,
    });
    expect(["medium", "low"]).toContain(r.confidenceLevel);
  });

  it("downgrades stale analyses", () => {
    const old = new Date(Date.now() - 40 * 86400000);
    const r = refineDealAnalysisConfidence({
      ...base,
      analysisUpdatedAt: old,
    });
    expect(r.confidenceLevel).not.toBe("high");
  });

  it("adds conflict warning when risk and opportunity both high", () => {
    const r = refineDealAnalysisConfidence({
      ...base,
      investmentScore: 80,
      riskScore: 75,
    });
    expect(r.extraWarnings.length).toBeGreaterThan(0);
  });
});
