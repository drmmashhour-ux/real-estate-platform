import { describe, it, expect } from "vitest";
import { buildPortfolioInsights } from "../capital-portfolio-insight.service";
import { simulateCapitalScenario } from "../capital-scenario.service";
import { generateCapitalRecommendations } from "../capital-recommendation.service";
import type { AllocationPlanResult } from "../capital-allocator.types";

const mockPlan: AllocationPlanResult = {
  totalBudget: 100000,
  allocatableBudget: 90000,
  reserveBudget: 10000,
  items: [
    {
      listingId: "l1",
      listingTitle: "Luxury Condo",
      allocationType: "growth",
      priorityScore: 0.9,
      expectedImpactScore: 0.8,
      confidenceScore: 0.9,
      recommendedAmount: 20000,
      allocatedAmount: 18000,
      rationale: ["High demand"],
      metrics: {
        listingId: "l1",
        listingTitle: "Luxury Condo",
        grossRevenue: 50000,
        occupancyRate: 0.8,
        adr: 200,
        revpar: 160,
        bookingCount: 20,
        recommendation: null,
        recommendationScore: 0.9,
        recommendationConfidence: 0.8,
        upliftScore: 0.9,
        pricingActionSuccess: null,
        operatingCostMonthly: null,
        improvementBudgetNeed: null,
        marketingBudgetNeed: null,
        operationalRiskScore: 0.1,
        manualCapitalLock: false,
      },
    },
    {
      listingId: "l2",
      listingTitle: "Underperforming Loft",
      allocationType: "hold",
      priorityScore: 0.3,
      expectedImpactScore: 0.2,
      confidenceScore: 0.5,
      recommendedAmount: 5000,
      allocatedAmount: 4000,
      rationale: ["Low occupancy"],
      metrics: {
        listingId: "l2",
        listingTitle: "Underperforming Loft",
        grossRevenue: 5000,
        occupancyRate: 0.2,
        adr: 100,
        revpar: 20,
        bookingCount: 5,
        recommendation: null,
        recommendationScore: 0.2,
        recommendationConfidence: 0.4,
        upliftScore: 0.1,
        pricingActionSuccess: null,
        operatingCostMonthly: null,
        improvementBudgetNeed: null,
        marketingBudgetNeed: null,
        operationalRiskScore: 0.9,
        manualCapitalLock: false,
      },
    },
  ],
};

describe("Capital Allocator V2 Engine", () => {
  it("should generate portfolio insights", () => {
    const insights = buildPortfolioInsights(mockPlan);
    expect(insights.topPerformers[0].listingId).toBe("l1");
    expect(insights.underperformers[0].listingId).toBe("l2");
    expect(insights.riskAlerts.length).toBeGreaterThan(0);
  });

  it("should simulate scenarios correctly", () => {
    const simulation = simulateCapitalScenario(mockPlan, {
      additionalBudget: 50000,
      reallocationStrategy: "aggressive",
    });
    expect(simulation.bestAllocationStrategy.totalBudget).toBe(150000);
    expect(simulation.projectedImpact).toBeGreaterThan(0);
  });

  it("should generate actionable recommendations", () => {
    const recommendations = generateCapitalRecommendations(mockPlan);
    expect(recommendations.some(r => r.listingId === "l1" && r.recommendation.includes("Increase"))).toBe(true);
    expect(recommendations.some(r => r.listingId === "l2" && r.recommendation.includes("Reduce"))).toBe(true);
  });
});
