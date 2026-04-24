import { describe, expect, it } from "vitest";
import { ACQUISITION, IPO } from "../exit-types";
import { evaluateExit } from "../evaluation.engine";
import type { CompanyMetrics } from "../metrics.service";

const base = (): CompanyMetrics => ({
  currency: "USD",
  annualRevenue: 80_000_000,
  revenueGrowthYoy: 0.25,
  profitability: { ebitdaMargin: 0.18 },
  marketPresence: { normalizedScore: 0.55, summary: "Regional leader" },
  readiness: {
    acquisition: { strategicValue: 4, buyerInterest: 3, integrationEase: 4 },
    ipo: { governanceMaturity: 2, financialReportingMaturity: 3, resultsConsistency: 3 },
  },
});

describe("evaluateExit", () => {
  it("returns NEED_MORE_DATA when revenue is missing or zero", () => {
    const m = base();
    m.annualRevenue = 0;
    const r = evaluateExit(m);
    expect(r.recommendation).toBe("NEED_MORE_DATA");
    expect(r.gaps.length).toBeGreaterThan(0);
  });

  it("leans acquisition when acquisition readiness clearly leads", () => {
    const m = base();
    m.readiness = {
      acquisition: { strategicValue: 5, buyerInterest: 5, integrationEase: 5 },
      ipo: { governanceMaturity: 1, financialReportingMaturity: 1, resultsConsistency: 1 },
    };
    const r = evaluateExit(m);
    expect(r.recommendation).toBe(ACQUISITION);
    expect(r.acquisition.overallScore).toBeGreaterThan(r.ipo.overallScore);
  });

  it("leans IPO when IPO readiness clearly leads", () => {
    const m = base();
    m.annualRevenue = 200_000_000;
    m.readiness = {
      acquisition: { strategicValue: 1, buyerInterest: 1, integrationEase: 2 },
      ipo: { governanceMaturity: 5, financialReportingMaturity: 5, resultsConsistency: 5 },
    };
    const r = evaluateExit(m);
    expect(r.recommendation).toBe(IPO);
    expect(r.ipo.overallScore).toBeGreaterThan(r.acquisition.overallScore);
  });

  it("returns EITHER when scores are near parity", () => {
    const m = base();
    m.readiness = {
      acquisition: { strategicValue: 3, buyerInterest: 3, integrationEase: 3 },
      ipo: { governanceMaturity: 3, financialReportingMaturity: 3, resultsConsistency: 3 },
    };
    const r = evaluateExit(m);
    expect(r.recommendation).toBe("EITHER");
  });

  it("includes risks for both paths", () => {
    const r = evaluateExit(base());
    expect(r.risks).toHaveLength(2);
    expect(r.risks.map((x) => x.path).sort()).toEqual([ACQUISITION, IPO].sort());
  });
});
