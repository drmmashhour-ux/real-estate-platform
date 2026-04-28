/**
 * SYBNB-27 — USD band for field-agent listing incentives (copy-only; settlements stay manual).
 */

export function getSybnbAgentListingUsdBand(): { min: number; max: number } {
  const min = Number(process.env.NEXT_PUBLIC_SYBNB_AGENT_USD_LISTING_MIN ?? "0.5");
  const max = Number(process.env.NEXT_PUBLIC_SYBNB_AGENT_USD_LISTING_MAX ?? "1");
  return {
    min: Number.isFinite(min) && min >= 0 ? min : 0.5,
    max: Number.isFinite(max) && max >= 0 ? max : 1,
  };
}
