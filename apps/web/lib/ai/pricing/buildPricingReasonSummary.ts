/**
 * Short, human-readable lines for pricing UI (no LLM).
 */

export type ReasonContext = {
  demandHigh?: boolean;
  demandLow?: boolean;
  occupancyLow?: boolean;
  viewsUpNoBookings?: boolean;
  weekendPeak?: boolean;
  cappedByMin?: boolean;
  cappedByMax?: boolean;
  cappedByDailyPct?: boolean;
};

export function buildPricingReasonSummary(ctx: ReasonContext): string {
  const parts: string[] = [];
  if (ctx.weekendPeak) parts.push("High weekend demand detected");
  if (ctx.demandHigh && !ctx.weekendPeak) parts.push("Strong demand signals vs recent period");
  if (ctx.demandLow) parts.push("Soft demand — consider a modest price adjustment");
  if (ctx.occupancyLow) parts.push("Occupancy is low compared to similar listings");
  if (ctx.viewsUpNoBookings) parts.push("Recent views increased without conversions");
  if (ctx.cappedByMin) parts.push("Price capped by host minimum rule");
  if (ctx.cappedByMax) parts.push("Price capped by host maximum rule");
  if (ctx.cappedByDailyPct) parts.push("Change limited by max daily change %");
  if (parts.length === 0) parts.push("Balanced pricing based on current signals");
  return parts.join(" · ");
}
