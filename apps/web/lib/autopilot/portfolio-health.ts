export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computePortfolioHealth(input: {
  properties: Array<{
    currentValueCents?: number | null;
    monthlyCashflowCents?: number | null;
    capRate?: number | null;
    roiPercent?: number | null;
    dscr?: number | null;
    rankingScore?: number | null;
    riskLevel?: string | null;
    neighborhoodScore?: number | null;
  }>;
}) {
  const props = input.properties ?? [];
  if (!props.length) {
    return {
      overallHealthScore: 0,
      concentrationRisk: 0,
      cashflowStrength: 0,
      growthStrength: 0,
      riskScore: 0,
    };
  }

  const totalValue = props.reduce((s, p) => s + (p.currentValueCents ?? 0), 0);

  const largestWeight =
    totalValue > 0
      ? Math.max(
          ...props.map((p) => (p.currentValueCents ?? 0) / totalValue)
        )
      : 0;

  const avgCashflow =
    props.reduce((s, p) => s + (p.monthlyCashflowCents ?? 0), 0) /
    props.length;

  const avgROI =
    props.reduce((s, p) => s + ((p.roiPercent ?? 0) * 100), 0) / props.length;

  const avgDSCR =
    props.reduce((s, p) => s + (p.dscr ?? 0), 0) / props.length;

  const avgNeighborhood =
    props.reduce((s, p) => s + (p.neighborhoodScore ?? 0), 0) / props.length;

  const highRiskCount = props.filter((p) => p.riskLevel === "high").length;

  const concentrationRisk = clamp(largestWeight * 100);
  const cashflowStrength = clamp(50 + avgCashflow / 5000);
  const growthStrength = clamp(avgROI * 0.8 + avgNeighborhood * 0.2);
  const riskScore = clamp(highRiskCount * 18 + Math.max(0, 1.2 - avgDSCR) * 40);

  const overallHealthScore = clamp(
    cashflowStrength * 0.35 +
      growthStrength * 0.3 +
      (100 - concentrationRisk) * 0.15 +
      (100 - riskScore) * 0.2
  );

  return {
    overallHealthScore: Math.round(overallHealthScore),
    concentrationRisk: Math.round(concentrationRisk),
    cashflowStrength: Math.round(cashflowStrength),
    growthStrength: Math.round(growthStrength),
    riskScore: Math.round(riskScore),
  };
}
