import { predictUnitPrice, type UnitPricingProject, type UnitPricingUnit } from "./unit-pricing";

export type BuyerProfileInput = {
  userId?: string;
  cityPreference?: string | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  minBedrooms?: number | null;
  investmentGoal?: string | null;
  preferredDeliveryYear?: number | null;
};

export type ProjectMatch = {
  projectId: string;
  matchScore: number;
  reasons: string[];
  recommendedUnitId: string | null;
};

export function matchBuyerToProjects(
  profile: BuyerProfileInput,
  projects: UnitPricingProject[],
  unitsByProject: Record<string, UnitPricingUnit[]>
): ProjectMatch[] {
  const prefCity = (profile.cityPreference ?? "").toLowerCase();
  const goal = (profile.investmentGoal ?? "").toLowerCase();
  const targetYear = profile.preferredDeliveryYear ?? null;

  const matches = projects.map((project) => {
    const units = unitsByProject[project.id] ?? [];
    const unit = units[0] ?? {
      id: null,
      type: "project",
      price: project.startingPrice ?? 350000,
      size: 0,
      status: "available",
    };
    const pricing = predictUnitPrice(project, unit as UnitPricingUnit);
    let score = 45;
    const reasons: string[] = [];

    if (prefCity && (project.city ?? "").toLowerCase().includes(prefCity)) {
      score += 18;
      reasons.push(`Matches city preference: ${profile.cityPreference}`);
    }

    const price = unit.price ?? project.startingPrice ?? 0;
    if (profile.minBudget != null && price >= profile.minBudget) {
      score += 7;
      reasons.push("Within minimum budget");
    }
    if (profile.maxBudget != null && price <= profile.maxBudget) {
      score += 12;
      reasons.push("Within budget");
    }

    if (targetYear && project.deliveryDate) {
      const deliveryYear = new Date(project.deliveryDate).getFullYear();
      if (!Number.isNaN(deliveryYear) && Math.abs(deliveryYear - targetYear) <= 1) {
        score += 10;
        reasons.push("Delivery timing aligns");
      }
    }

    if (goal.includes("rental") && pricing.estimatedRentalYield >= 0.055) {
      score += 12;
      reasons.push("Strong rental yield");
    }
    if (goal.includes("appreciation") && pricing.predictedGrowthPercent >= 10) {
      score += 12;
      reasons.push("Strong appreciation potential");
    }
    if (goal.includes("luxury") || goal.includes("residence")) {
      if (project.featured) {
        score += 8;
        reasons.push("Premium/featured project");
      }
      if ((unit.type ?? "").toLowerCase().includes("penthouse")) {
        score += 8;
        reasons.push("Luxury unit type");
      }
    }

    if (profile.minBedrooms && (unit.type ?? "").toLowerCase().includes(String(profile.minBedrooms))) {
      score += 4;
      reasons.push("Bedroom fit");
    }

    const recommendedUnitId = units.find((u) => {
      const uPrice = u.price ?? 0;
      const withinMax = profile.maxBudget == null || uPrice <= profile.maxBudget;
      const withinMin = profile.minBudget == null || uPrice >= profile.minBudget;
      return withinMax && withinMin;
    })?.id ?? unit.id ?? null;

    score = Math.max(0, Math.min(100, score));
    if (reasons.length === 0) reasons.push("Balanced fit for this profile");

    return { projectId: project.id, matchScore: score, reasons, recommendedUnitId };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
