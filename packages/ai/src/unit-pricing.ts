/**
 * Heuristic AI unit pricing model with safe fallbacks.
 */

export type UnitPricingProject = {
  id: string;
  city?: string;
  status?: string;
  deliveryDate?: string | Date | null;
  startingPrice?: number | null;
  featured?: boolean | null;
  [key: string]: unknown;
};

export type UnitPricingUnit = {
  id: string;
  type?: string | null;
  price?: number | null;
  size?: number | null;
  status?: string | null;
  [key: string]: unknown;
};

export type UnitPricingResult = {
  predictedCurrentValue: number;
  predictedDeliveryValue: number;
  predicted1YearValue: number;
  predictedGrowthPercent: number;
  estimatedRentalYield: number;
  confidence: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function yearsToDelivery(project: UnitPricingProject): number {
  if (!project.deliveryDate) return 1.5;
  const date = new Date(project.deliveryDate);
  if (Number.isNaN(date.getTime())) return 1.5;
  const diffYears = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
  return clamp(diffYears, 0, 5);
}

export function predictUnitPrice(project: UnitPricingProject, unit: UnitPricingUnit): UnitPricingResult {
  const base = unit.price ?? project.startingPrice ?? 350000;
  const size = unit.size ?? 60;
  const city = (project.city ?? "").toLowerCase();
  const type = (unit.type ?? "").toLowerCase();
  const status = (project.status ?? "").toLowerCase();
  const featuredBoost = project.featured ? 0.06 : 0;

  let marketLift = 0.04;
  if (city === "montreal") marketLift += 0.045;
  if (city === "laval") marketLift += 0.035;
  if (status === "upcoming") marketLift += 0.05;
  if (status === "under-construction") marketLift += 0.03;
  if (type.includes("penthouse") || type.includes("luxury")) marketLift += 0.04;
  if (size >= 90) marketLift += 0.02;
  if (size <= 45) marketLift += 0.015;

  const deliveryFactor = yearsToDelivery(project);
  const predictedGrowthPercent = clamp((marketLift + featuredBoost + Math.max(0, 0.03 * (1.5 - deliveryFactor))) * 100, 2, 24);
  const predictedDeliveryValue = Math.round(base * (1 + predictedGrowthPercent / 100));
  const predicted1YearValue = Math.round(base * (1 + clamp(predictedGrowthPercent * 0.6, 1.5, 18) / 100));
  const predictedCurrentValue = Math.round(base * (1 + clamp((marketLift - 0.01) * 0.4, 0.01, 0.08)));
  const estimatedRentalYield = clamp(
    (city === "montreal" ? 0.052 : city === "laval" ? 0.058 : 0.049) +
      (type.includes("studio") ? 0.01 : 0) +
      (type.includes("1bed") ? 0.006 : 0) +
      (featuredBoost ? 0.002 : 0),
    0.035,
    0.085
  );
  const confidence = clamp(
    58 +
      (project.city ? 8 : 0) +
      (project.deliveryDate ? 8 : 0) +
      (unit.price ? 8 : 0) +
      (unit.size ? 4 : 0) +
      (project.featured ? 4 : 0),
    55,
    92
  );

  return {
    predictedCurrentValue,
    predictedDeliveryValue,
    predicted1YearValue,
    predictedGrowthPercent,
    estimatedRentalYield,
    confidence,
  };
}

export function predictPriceGrowth(project: UnitPricingProject, unit: UnitPricingUnit): number {
  return predictUnitPrice(project, unit).predictedGrowthPercent;
}

export function estimateRentalYield(project: UnitPricingProject, unit: UnitPricingUnit): number {
  return predictUnitPrice(project, unit).estimatedRentalYield;
}
