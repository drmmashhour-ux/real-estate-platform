function clamp01(x: number): number {
  if (!Number.isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

/** Reward when lead outcomes or conversion proxy present; else null (generic path). */
export function computeLeadsKpiReward(params: {
  realizedValue?: number;
  realizedRevenue?: number;
  realizedConversion?: number;
  riskScore?: number;
}): number | null {
  const parts: number[] = [];
  if (params.realizedConversion != null && Number.isFinite(params.realizedConversion)) {
    const c = params.realizedConversion > 1 ? params.realizedConversion / 100 : params.realizedConversion;
    parts.push(0.5 * clamp01(c) + 0.1);
  }
  if (params.realizedRevenue != null && Number.isFinite(params.realizedRevenue) && params.realizedRevenue >= 0) {
    parts.push(0.25 * clamp01(Math.log1p(params.realizedRevenue) / 18));
  }
  if (params.realizedValue != null && Number.isFinite(params.realizedValue)) {
    parts.push(0.2 * clamp01(Math.log1p(Math.abs(params.realizedValue)) / 22));
  }
  if (parts.length === 0) {
    return null;
  }
  const r = parts.reduce((a, b) => a + b) / parts.length;
  if (params.riskScore != null && Number.isFinite(params.riskScore) && parts.length) {
    return clamp01(r * (1 - 0.25 * clamp01(params.riskScore)));
  }
  return clamp01(r);
}
