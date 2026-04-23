import type { AllocationPlanResult, AllocationPlanLine } from "./capital-allocator.types";

export type CapitalRecommendation = {
  listingId: string;
  listingTitle: string;
  recommendation: string;
  reason: string;
  confidenceScore: number;
};

export function generateCapitalRecommendations(plan: AllocationPlanResult): CapitalRecommendation[] {
  const recommendations: CapitalRecommendation[] = [];

  plan.items.forEach((item) => {
    if (item.priorityScore > 0.8 && item.allocatedAmount < item.recommendedAmount) {
      recommendations.push({
        listingId: item.listingId,
        listingTitle: item.listingTitle,
        recommendation: `Increase investment in ${item.listingTitle}`,
        reason: "High priority score with under-allocated budget pool constraints.",
        confidenceScore: item.confidenceScore,
      });
    }

    if ((item.metrics.operationalRiskScore ?? 0) > 0.7) {
      recommendations.push({
        listingId: item.listingId,
        listingTitle: item.listingTitle,
        recommendation: `Reduce spend on ${item.listingTitle}`,
        reason: "High operational risk detected. Pausing or reducing non-essential spend.",
        confidenceScore: 0.9,
      });
    }

    if (item.metrics.occupancyRate < 0.3) {
      recommendations.push({
        listingId: item.listingId,
        listingTitle: item.listingTitle,
        recommendation: `Pause marketing for ${item.listingTitle}`,
        reason: "Severely low occupancy. Review pricing or operational blockers first.",
        confidenceScore: 0.75,
      });
    }
  });

  return recommendations;
}
