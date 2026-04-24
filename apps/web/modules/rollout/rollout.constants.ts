/** Stable strategy keys for rollout runtime lookups. */
export const ROLLOUT_STRATEGY = {
  LEAD_BASE_PRICE_RELATIVE: "lead_base_price_relative",
  FEATURED_BASE_PRICE_RELATIVE: "featured_base_price_relative",
  RESIDENCE_RANK_BOOST: "residence_rank_boost",
  EVOLUTION_ARMS: "evolution_arms",
} as const;

/** Gradual ramp — never jump from 0 to 100 in one step. */
export const ROLLOUT_PERCENT_LADDER = [5, 10, 25, 50, 75, 100] as const;

export const ROLLOUT_INITIAL_PERCENT = ROLLOUT_PERCENT_LADDER[0];

/** Relative metric drop that triggers automatic rollback (default 8%). */
export function getRolloutDegradeThreshold(): number {
  const raw = Number(process.env.ROLLOUT_DEGRADE_THRESHOLD ?? 0.08);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.08;
}
