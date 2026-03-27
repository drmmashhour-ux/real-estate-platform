import { predictUnitPrice, type UnitPricingProject, type UnitPricingUnit } from "./unit-pricing";

export type RankedProject = {
  projectId: string;
  score: number;
  rank?: number;
  appreciationPotential: number;
  rentalYield: number;
  riskScore: number;
  reason: string;
  bestUnitSuggestion: {
    unitId: string | null;
    label: string;
    predictedValue: number;
  };
};

function cityDemand(city?: string) {
  const c = (city ?? "").toLowerCase();
  if (c === "montreal") return 0.92;
  if (c === "laval") return 0.84;
  if (c.includes("westmount") || c.includes("old")) return 0.95;
  return 0.72;
}

export function rankProjectsForInvestment(
  projects: UnitPricingProject[],
  unitsByProject: Record<string, UnitPricingUnit[]>
): RankedProject[] {
  const ranked = projects.map((project) => {
    const units = unitsByProject[project.id] ?? [];
    const bestUnit = units[0] ?? {
      id: null,
      type: "project",
      price: project.startingPrice ?? 350000,
      size: 0,
      status: "available",
    };
    const pricing = predictUnitPrice(project, bestUnit as UnitPricingUnit);
    const demand = cityDemand(project.city);
    const deliveryBonus = project.status === "upcoming" ? 0.12 : project.status === "under-construction" ? 0.08 : 0.04;
    const premiumBonus = project.featured ? 0.08 : 0;
    const appreciationPotential = Math.round((pricing.predictedGrowthPercent / 100 + deliveryBonus + premiumBonus) * 100);
    const rentalYield = Number((pricing.estimatedRentalYield * (0.95 + demand * 0.08)).toFixed(3));
    const riskScore = Math.round(
      100 -
        (demand * 35 +
          (project.featured ? 8 : 0) +
          (project.status === "delivered" ? 8 : 0) +
          (project.status === "upcoming" ? 6 : 0))
    );
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(demand * 40 + appreciationPotential * 0.35 + rentalYield * 300 + (100 - riskScore) * 0.2)
      )
    );
    const reason = [
      project.featured ? "Featured project momentum" : null,
      project.city ? `${project.city} demand` : null,
      project.status === "upcoming" ? "Early-stage appreciation upside" : null,
      rentalYield >= 0.055 ? "Strong rental profile" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Balanced investment opportunity";

    return {
      projectId: project.id,
      score,
      appreciationPotential,
      rentalYield,
      riskScore,
      reason,
      bestUnitSuggestion: {
        unitId: bestUnit.id ?? null,
        label: bestUnit.type ?? "Best unit",
        predictedValue: pricing.predictedDeliveryValue,
      },
    } satisfies RankedProject;
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((item, index) => ({ ...item, rank: index + 1 }));
}
