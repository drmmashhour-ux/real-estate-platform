/**
 * SYBNB-22 — Early monetization positioning (optional featured boost).
 * Dollar band is for outbound copy only; settlement stays manual (WhatsApp / proof).
 */

export function getSybnbFeaturedUsdBand(): { min: number; max: number } {
  const min = Number(process.env.NEXT_PUBLIC_SYBNB_FEATURED_USD_MIN ?? "5");
  const max = Number(process.env.NEXT_PUBLIC_SYBNB_FEATURED_USD_MAX ?? "5");
  return {
    min: Number.isFinite(min) && min > 0 ? min : 5,
    max: Number.isFinite(max) && max > 0 ? max : 5,
  };
}
