import type { AllocationPlanResult, AllocationPlanLine } from "./capital-allocator.types";

export type PortfolioInsights = {
  topPerformers: AllocationPlanLine[];
  underperformers: AllocationPlanLine[];
  highGrowthPotential: AllocationPlanLine[];
  riskAlerts: { listingId: string; listingTitle: string; reason: string; severity: "medium" | "high" }[];
};

export function buildPortfolioInsights(plan: AllocationPlanResult): PortfolioInsights {
  const items = plan.items;

  // Top performers: high revenue + high occupancy
  const topPerformers = [...items]
    .sort((a, b) => b.metrics.grossRevenue - a.metrics.grossRevenue)
    .slice(0, 3);

  // Underperformers: low occupancy + high operational risk
  const underperformers = items.filter(
    (i) => i.metrics.occupancyRate < 0.4 || (i.metrics.operationalRiskScore ?? 0) > 0.7
  );

  // High growth potential: high uplift score + high recommendation score
  const highGrowthPotential = items.filter(
    (i) => (i.metrics.upliftScore ?? 0) > 0.8 && (i.metrics.recommendationScore ?? 0) > 0.8
  );

  // Risk alerts
  const riskAlerts: PortfolioInsights["riskAlerts"] = [];
  items.forEach((i) => {
    if ((i.metrics.operationalRiskScore ?? 0) > 0.8) {
      riskAlerts.push({
        listingId: i.listingId,
        listingTitle: i.listingTitle,
        reason: "Critical operational risk detected.",
        severity: "high",
      });
    }
    if (i.metrics.occupancyRate < 0.3) {
      riskAlerts.push({
        listingId: i.listingId,
        listingTitle: i.listingTitle,
        reason: "Severely low occupancy rate.",
        severity: "medium",
      });
    }
  });

  return {
    topPerformers,
    underperformers,
    highGrowthPotential,
    riskAlerts,
  };
}
