/**
 * Env-gated feature switches (no deploy to flip). Prefer `1` to enable.
 * For broader launch rollouts, see `lib/launch/resolve-launch-flags.ts` + `lib/config/flags.ts`.
 */
export const flags = {
  AI_PRICING: process.env.FEATURE_AI_PRICING === "1",
  AUTONOMOUS_AGENT: process.env.FEATURE_AI_AGENT === "1",
  RECOMMENDATIONS: process.env.FEATURE_RECO === "1",
} as const;

export type FeatureFlags = typeof flags;
