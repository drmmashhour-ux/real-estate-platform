import { describe, expect, it } from "vitest";
import { buildInvestorNarrative } from "@/modules/investors/investor-narrative.service";
import type { InvestorNarrativeInput } from "@/modules/investors/investor-metrics.service";

const baseInput: InvestorNarrativeInput = {
  windowDays: 14,
  leadsCur: 24,
  leadsPrev: 20,
  dealsWonCur: 2,
  dealsWonPrev: 1,
  qualifiedPct: 0.3,
  revenueInsufficient: true,
  revenueCentralCad: null,
  revenueBandLabel: null,
  forecastConfidence: null,
  aiSparseTelemetry: true,
  brokerInsufficientUniform: false,
  scaleLeadDelta: 4,
  scaleLeadBand: "positive",
  topCity: "Montréal",
  topCityScore: 72,
  weakestCity: "Ottawa",
  expansionSnippet: "Test city insight line",
  comparisonInsightLines: ["Second line"],
  sparseBundle: false,
};

describe("buildInvestorNarrative", () => {
  it("produces deterministic headline for same input", () => {
    const a = buildInvestorNarrative(baseInput);
    const b = buildInvestorNarrative(baseInput);
    expect(a.headline).toBe(b.headline);
    expect(a.summary).toBe(b.summary);
  });

  it("uses sparse-bundle headline when flagged", () => {
    const n = buildInvestorNarrative({ ...baseInput, sparseBundle: true });
    expect(n.headline.toLowerCase()).toContain("limited logging");
  });

  it("includes revenue story line only when forecast sufficient", () => {
    const without = buildInvestorNarrative(baseInput);
    expect(without.growthStory.some((x) => /Illustrative CRM-based revenue/i.test(x))).toBe(false);
    const withRf = buildInvestorNarrative({
      ...baseInput,
      revenueInsufficient: false,
      revenueCentralCad: 125000,
      revenueBandLabel: "100k–140k CAD (illustrative)",
      forecastConfidence: "medium",
    });
    expect(withRf.growthStory.some((x) => /125[\s,.]?000|125,000/i.test(x))).toBe(true);
  });

  it("always carries non-empty risk disclosure tail", () => {
    const n = buildInvestorNarrative(baseInput);
    expect(n.risks.some((x) => /past pipeline/i.test(x))).toBe(true);
  });
});
