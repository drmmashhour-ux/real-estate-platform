/**
 * Hard caps for dynamic pricing suggestions (product requirement: no drastic moves).
 * Suggestions are clamped; hosts always see raw vs clamped when clamping occurs.
 */

export const PRICING_AI_MAX_INCREASE_RATIO = 0.3;
export const PRICING_AI_MAX_DECREASE_RATIO = 0.3;

export function clampSuggestedPriceCents(
  baseCents: number,
  rawSuggestedCents: number,
): { cents: number; clamped: boolean; floorCents: number; capCents: number } {
  if (!Number.isFinite(baseCents) || baseCents <= 0) {
    return {
      cents: Math.max(0, Math.round(rawSuggestedCents)),
      clamped: false,
      floorCents: 0,
      capCents: 0,
    };
  }
  const floorCents = Math.max(50, Math.round(baseCents * (1 - PRICING_AI_MAX_DECREASE_RATIO)));
  const capCents = Math.max(floorCents, Math.round(baseCents * (1 + PRICING_AI_MAX_INCREASE_RATIO)));
  const rounded = Math.max(50, Math.round(rawSuggestedCents));
  if (rounded < floorCents) {
    return { cents: floorCents, clamped: true, floorCents, capCents };
  }
  if (rounded > capCents) {
    return { cents: capCents, clamped: true, floorCents, capCents };
  }
  return { cents: rounded, clamped: false, floorCents, capCents };
}
