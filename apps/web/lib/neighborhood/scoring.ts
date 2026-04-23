export type NeighborhoodScoreInput = {
  avgSalePriceCents: number;
  avgPricePerSqftCents: number;
  avgRentCents: number;
  comparableCount: number;
  inventoryCount: number;
  yieldRatio: number;
  trendChangeRatio: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computeNeighborhoodScores(input: NeighborhoodScoreInput) {
  const demand = clamp(
    40 +
      Math.min(input.comparableCount, 50) * 0.7 +
      Math.min(input.inventoryCount, 50) * 0.2 +
      input.trendChangeRatio * 100,
  );

  const value = clamp(100 - Math.min(input.avgPricePerSqftCents / 100, 100));

  const yieldScore = clamp(input.yieldRatio * 2000);

  const risk = clamp(
    60 -
      input.trendChangeRatio * 120 -
      Math.min(input.comparableCount, 50) * 0.5 +
      (input.inventoryCount > 40 ? 12 : 0),
  );

  const overall = clamp(demand * 0.3 + value * 0.25 + yieldScore * 0.25 + (100 - risk) * 0.2);

  let trendDirection = "stable";
  if (input.trendChangeRatio > 0.03) trendDirection = "up";
  if (input.trendChangeRatio < -0.03) trendDirection = "down";

  let investmentZone = "neutral";
  if (overall >= 75 && risk < 40) investmentZone = "prime";
  else if (yieldScore >= 65 && trendDirection === "up") investmentZone = "growth";
  else if (value >= 65 && risk < 60) investmentZone = "value_add";
  else if (risk >= 70) investmentZone = "high_risk";

  return {
    scoreOverall: Math.round(overall),
    scoreDemand: Math.round(demand),
    scoreValue: Math.round(value),
    scoreYield: Math.round(yieldScore),
    scoreRisk: Math.round(risk),
    trendDirection,
    investmentZone,
  };
}
