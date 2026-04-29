/**
 * Lightweight unit value projection for pre-sales projects (deterministic heuristic).
 */

type ProjectPricingInput = {
  id: string;
  city?: string | null;
  status?: string | null;
  startingPrice?: number | null;
  featured?: boolean | null;
  deliveryDate?: Date | string | null;
};

type UnitPricingInput = {
  id: string;
  type: string;
  price: number;
  size: number;
  status?: string | null;
};

export type UnitPricePrediction = {
  predictedCurrentValue: number;
  predictedDeliveryValue: number;
  predicted1YearValue: number;
  predictedGrowthPercent: number;
  estimatedRentalYield: number;
  confidence: number;
};

function msFromDelivery(raw: ProjectPricingInput["deliveryDate"]): number | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw.getTime();
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : null;
}

export function predictUnitPrice(project: ProjectPricingInput, unit: UnitPricingInput): UnitPricePrediction {
  const base = Math.max(0, unit.price > 0 ? unit.price : project.startingPrice ?? 0);
  const status = (project.status ?? "").toLowerCase();
  const monthsToDelivery = (() => {
    const d = msFromDelivery(project.deliveryDate);
    if (d == null) return 18;
    const m = (d - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(3, Math.min(60, m));
  })();

  const constructionBoost =
    status.includes("construction") || status.includes("under") ? 1.04 : status.includes("complete") ? 1 : 1.02;
  const featuredBoost = project.featured ? 1.02 : 1;
  const sizeAdj = unit.size > 0 ? 1 + Math.min(0.08, (unit.size - 55) / 2000) : 1;

  const annualAppreciation = 0.035 + Math.min(0.02, monthsToDelivery / 600);
  const yearsToDelivery = monthsToDelivery / 12;

  const predictedCurrentValue = Math.round(base * sizeAdj * featuredBoost);
  const predictedDeliveryValue = Math.round(predictedCurrentValue * constructionBoost * (1 + annualAppreciation * yearsToDelivery));
  const predicted1YearValue = Math.round(predictedCurrentValue * (1 + annualAppreciation));
  const predictedGrowthPercent = predictedCurrentValue > 0
    ? ((predictedDeliveryValue - predictedCurrentValue) / predictedCurrentValue) * 100
    : 0;

  const rentFactor = unit.type.toLowerCase().includes("studio") ? 0.055 : 0.048;
  const estimatedRentalYield = Math.min(0.12, Math.max(0.03, rentFactor + (project.city?.length ? 0.002 : 0)));

  const confidence = Math.round(
    Math.min(92, 58 + (project.city ? 8 : 0) + (unit.size > 40 ? 6 : 0) + (project.featured ? 4 : 0))
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
