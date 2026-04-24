function clamp01(x: number): number {
  if (!Number.isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

/**
 * Reward from conversion (primary) plus revenue / value as engagement proxy.
 * Returns null when not enough signal — generic bandit reward applies.
 */
export function computeGrowthKpiReward(params: {
  realizedValue?: number;
  realizedRevenue?: number;
  realizedConversion?: number;
  riskScore?: number;
}): number | null {
  const parts: number[] = [];
  if (params.realizedConversion != null && Number.isFinite(params.realizedConversion)) {
    const c = params.realizedConversion > 1 ? params.realizedConversion / 100 : params.realizedConversion;
    parts.push(0.55 * clamp01(c) + 0.15);
  }
  if (params.realizedRevenue != null && Number.isFinite(params.realizedRevenue) && params.realizedRevenue >= 0) {
    parts.push(0.2 * clamp01(Math.log1p(params.realizedRevenue) / 16));
  }
  if (params.realizedValue != null && Number.isFinite(params.realizedValue)) {
    parts.push(0.15 * clamp01(Math.log1p(Math.abs(params.realizedValue)) / 20));
  }
  if (parts.length === 0) {
    return null;
  }
  const r = parts.reduce((a, b) => a + b, 0) / parts.length;
  if (params.riskScore != null && Number.isFinite(params.riskScore) && parts.length) {
    return clamp01(r * (1 - 0.3 * clamp01(params.riskScore)));
  }
  return clamp01(r);
}
