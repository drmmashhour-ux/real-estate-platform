import { competitorPriceAdjustment } from "./competitor.engine";
import { estimateDemandAdjustment } from "./demand.engine";
import { clampSuggestedPriceCents } from "./safety";
import type { PricingAiListingInput, PricingAiSignalBundle, PricingAiSuggestMode } from "./signals.types";

export type PricingAiSuggestion = {
  suggestedPriceCents: number;
  priceDeltaCents: number;
  priceDeltaPct: number;
  /** Pre-safety raw suggestion (transparent if clamped). */
  rawSuggestedPriceCents: number;
  safetyClamped: boolean;
  safetyFloorCents: number;
  safetyCapCents: number;
  reasoning: string[];
  /** How the listing is configured; GET never auto-writes price. */
  pricingMode: PricingAiSuggestMode;
  /** True when mode is auto-style and suggestion stayed inside safety band (informational only). */
  wouldAutoApplyWithinSafeLimits: boolean;
};

function leadTimeMultiplier(days: number | null): { mult: number; lines: string[] } {
  if (days == null || !Number.isFinite(days)) {
    return { mult: 1, lines: [] };
  }
  const lines: string[] = [];
  if (days <= 1) {
    lines.push("Check-in is very soon; a small last-minute premium is common if you still have availability.");
    return { mult: 1.04, lines };
  }
  if (days <= 7) {
    lines.push("Check-in is within a week; demand is often less elastic — a light premium is plausible.");
    return { mult: 1.025, lines };
  }
  if (days >= 75) {
    lines.push("Far-out dates can benefit from a slight softener to seed the calendar.");
    return { mult: 0.985, lines };
  }
  return { mult: 1, lines };
}

function normalizePricingMode(raw: string | null | undefined): PricingAiSuggestMode {
  const m = (raw ?? "MANUAL").toUpperCase();
  if (m === "FULL_AUTOPILOT" || m === "AUTO" || m === "AUTO_APPROVE_SAFE") return "auto";
  if (m === "ASSIST" || m === "ASSISTED") return "assist";
  return "manual";
}

/**
 * Core suggestion: combines demand, comps, seasonality, lead time, optional events.
 * Always returns human-readable reasoning; applies ±30% safety vs current base.
 */
export function suggestDynamicPrice(
  listing: PricingAiListingInput,
  signals: PricingAiSignalBundle,
): PricingAiSuggestion {
  const base = signals.basePriceCents;
  const pricingMode = normalizePricingMode(listing.pricingMode);

  const { demandMultiplier, reasoning: demandReasons } = estimateDemandAdjustment(signals);
  const { competitorMultiplier, reasoning: compReasons } = competitorPriceAdjustment(listing, signals);

  const seasonMult = signals.seasonalityFactor;
  const { mult: leadMult, lines: leadLines } = leadTimeMultiplier(signals.bookingLeadTimeDays);
  const eventMult = 1 + Math.min(1, Math.max(0, signals.eventDemand01)) * 0.06;

  const combinedRaw =
    base * demandMultiplier * competitorMultiplier * seasonMult * leadMult * eventMult;
  const rawSuggestedPriceCents = Math.max(50, Math.round(combinedRaw));

  const { cents: suggestedPriceCents, clamped: safetyClamped, floorCents, capCents } =
    clampSuggestedPriceCents(base, rawSuggestedPriceCents);

  const reasoning: string[] = [
    `Current base nightly rate: ${(base / 100).toFixed(2)} (minor units preserved as cents internally).`,
    ...demandReasons,
    ...compReasons,
  ];

  if (seasonMult > 1.012) {
    reasoning.push(
      `Seasonality for the target window reads higher than average (factor ${seasonMult.toFixed(3)}).`,
    );
  } else if (seasonMult < 0.988) {
    reasoning.push(
      `Seasonality for the target window reads softer than average (factor ${seasonMult.toFixed(3)}).`,
    );
  } else {
    reasoning.push("Seasonality is near neutral for the target window.");
  }

  reasoning.push(...leadLines);

  if (signals.eventDemand01 >= 0.2) {
    reasoning.push(
      `Local event demand is elevated (signal ${signals.eventDemand01.toFixed(2)}); applied a small, capped bump.`,
    );
  }

  if (safetyClamped) {
    reasoning.push(
      `Safety cap: suggestion was limited to between ${(floorCents / 100).toFixed(2)} and ${(capCents / 100).toFixed(2)} (±30% of base) to avoid drastic swings.`,
    );
  }

  const priceDeltaCents = suggestedPriceCents - base;
  const priceDeltaPct = base > 0 ? priceDeltaCents / base : 0;

  const wouldAutoApplyWithinSafeLimits = pricingMode === "auto" && !safetyClamped;

  return {
    suggestedPriceCents,
    priceDeltaCents,
    priceDeltaPct,
    rawSuggestedPriceCents,
    safetyClamped,
    safetyFloorCents: floorCents,
    safetyCapCents: capCents,
    reasoning,
    pricingMode,
    wouldAutoApplyWithinSafeLimits,
  };
}
