/**
 * Growth Engine V4 — hard limits (suggestions only; no automatic spend execution).
 */
export const V4_MIN_CLICKS_TRUST = 100;
export const V4_MIN_IMPRESSIONS_TRUST = 1000;
/** Max upward adjustment per recommendation cycle (fraction of current budget). */
export const V4_MAX_BUDGET_INCREASE = 0.3;
/** Floor for recommended budget in major currency units (avoid zeroing live campaigns accidentally). */
export const V4_MIN_BUDGET_MAJOR = 1;
/** No single geo may receive more than this share after normalization. */
export const V4_MAX_GEO_BUDGET_SHARE = 0.4;
/** When only one geo exists, reserve this fraction for exploration / unallocated testing. */
export const V4_SINGLE_GEO_EXPLORATION_RESERVE = 0.2;

export function isTrustedVolume(clicks: number, impressions: number): boolean {
  return clicks >= V4_MIN_CLICKS_TRUST && impressions >= V4_MIN_IMPRESSIONS_TRUST;
}
