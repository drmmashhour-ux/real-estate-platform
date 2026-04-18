/** Simple multipliers — transparent, not predictive ML. */
export const SCENARIO_FACTORS = {
  optimistic: 1.15,
  baseline: 1,
  conservative: 0.85,
} as const;

export function projectFromRate(params: {
  observedCount: number;
  windowDays: number;
  horizonDays: number;
  scenario: keyof typeof SCENARIO_FACTORS;
}): number {
  const daily = params.observedCount / Math.max(1, params.windowDays);
  const raw = daily * params.horizonDays * SCENARIO_FACTORS[params.scenario];
  return Math.round(raw * 10) / 10;
}
