/** Non-negotiable caps — keep aligned with `guardrails` + `executor`. */
export const MAX_PRICE_CHANGE_PCT = 0.1;
export const MAX_ACTIONS_PER_HOUR = 5;
/** Suggestions only; `filterActions` always strips these for auto-apply. */
export const NEVER_AUTO_ACTION_TYPES = ["listing_improvement"] as const;
