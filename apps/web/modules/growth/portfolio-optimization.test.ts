import { describe, it, expect } from "vitest";
import { buildBudgetReallocationPlan } from "./budget-reallocation.service";
import { scoreCampaignForPortfolio } from "./portfolio-scoring.service";
import { buildPortfolioOptimizationSummary } from "./portfolio-optimization.service";
import { computePortfolioAlerts } from "./portfolio-alerts.service";
import type { CampaignPortfolioInput } from "./portfolio-optimization.types";


describe("portfolio-scoring.service", () => {
  it("scores profitable higher than unprofitable", () => {
    const good = scoreCampaignForPortfolio({
      campaignKey: "a",
      spend: 200,
      leads: 12,
      bookings: 2,
      profitabilityStatus: "PROFITABLE",
      confidenceScore: 0.8,
      ltvToCplRatio: 2.5,
      trend: "IMPROVING",
    });
    const bad = scoreCampaignForPortfolio({
      campaignKey: "b",
      spend: 200,
      leads: 12,
      bookings: 1,
      profitabilityStatus: "UNPROFITABLE",
      confidenceScore: 0.5,
      ltvToCplRatio: 0.7,
      trend: "DECLINING",
    });
    expect(good.portfolioScore).toBeGreaterThan(bad.portfolioScore);
  });
});

describe("budget-reallocation.service", () => {
  it("respects caps and minimum spend floor", () => {
    const campaigns: CampaignPortfolioInput[] = [
      {
        campaignKey: "weak1",
        spend: 100,
        leads: 10,
        bookings: 1,
        profitabilityStatus: "UNPROFITABLE",
        confidenceScore: 0.6,
        ltvToCplRatio: 0.7,
        trend: "DECLINING",
      },
      {
        campaignKey: "top1",
        spend: 300,
        leads: 20,
        bookings: 4,
        profitabilityStatus: "PROFITABLE",
        confidenceScore: 0.8,
        ltvToCplRatio: 2.2,
        trend: "IMPROVING",
      },
      {
        campaignKey: "top2",
        spend: 250,
        leads: 15,
        bookings: 3,
        profitabilityStatus: "BREAKEVEN",
        confidenceScore: 0.72,
        ltvToCplRatio: 1.4,
        trend: "IMPROVING",
      },
    ];
    const scored = campaigns.map(scoreCampaignForPortfolio);
    expect(scored.find((s) => s.campaignKey === "weak1")?.qualityLabel).toBe("WEAK");
    const recs = buildBudgetReallocationPlan({ campaigns, scored });
    for (const r of recs) {
      expect(r.amount).toBeLessThanOrEqual(25 + 0.01);
      expect(r.amount).toBeLessThanOrEqual(90 + 0.01);
    }
  });

  it("does not reallocate from weak low-confidence donors", () => {
    const campaigns: CampaignPortfolioInput[] = [
      {
        campaignKey: "weakLow",
        spend: 200,
        leads: 4,
        bookings: 0,
        profitabilityStatus: "UNPROFITABLE",
        confidenceScore: 0.4,
        ltvToCplRatio: 0.6,
      },
      {
        campaignKey: "top1",
        spend: 300,
        leads: 20,
        bookings: 4,
        profitabilityStatus: "PROFITABLE",
        confidenceScore: 0.8,
        ltvToCplRatio: 2.5,
      },
    ];
    const scored = campaigns.map(scoreCampaignForPortfolio);
    const recs = buildBudgetReallocationPlan({ campaigns, scored });
    expect(recs.length).toBe(0);
  });
});

describe("portfolio-optimization.service", () => {
  it("summary totals match", () => {
    const campaigns: CampaignPortfolioInput[] = [
      {
        campaignKey: "a",
        spend: 100,
        leads: 10,
        bookings: 2,
        profitabilityStatus: "PROFITABLE",
        confidenceScore: 0.8,
      },
      {
        campaignKey: "b",
        spend: 50,
        leads: 5,
        bookings: 1,
        profitabilityStatus: "BREAKEVEN",
        confidenceScore: 0.55,
      },
    ];
    const s = buildPortfolioOptimizationSummary(campaigns);
    expect(s.totalBudget).toBe(150);
    expect(s.reallocatableBudget).toBeGreaterThanOrEqual(0);
  });

  it("empty-state is safe", () => {
    const s = buildPortfolioOptimizationSummary([]);
    expect(s.totalBudget).toBe(0);
    expect(s.recommendations).toEqual([]);
  });
});

describe("portfolio-alerts.service", () => {
  it("flags too many unknowns", () => {
    const inputs: CampaignPortfolioInput[] = [
      {
        campaignKey: "x",
        spend: 10,
        leads: 1,
        bookings: 0,
        profitabilityStatus: "INSUFFICIENT_DATA",
        confidenceScore: 0.2,
      },
      {
        campaignKey: "y",
        spend: 10,
        leads: 1,
        bookings: 0,
        profitabilityStatus: "INSUFFICIENT_DATA",
        confidenceScore: 0.2,
      },
    ];
    const summary = buildPortfolioOptimizationSummary(inputs);
    const alerts = computePortfolioAlerts(summary, inputs);
    expect(alerts.some((a) => a.kind === "too_many_unknowns")).toBe(true);
  });
});

