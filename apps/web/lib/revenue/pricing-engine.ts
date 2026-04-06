/**
 * BNHub-style **suggestions only** — never mutates listing prices without an explicit approval record.
 * Pair with `lib/approvals/service.ts` + `routeSideEffect` for `pricing_or_fee_change`.
 */

export type PricingSignalInput = {
  /** Impressions or listing detail views in window */
  viewCount: number;
  /** Confirmed or paid bookings in same window */
  bookingCount: number;
  /** 0–1 occupancy or booking/night fill */
  occupancyRate: number;
  /** Current nightly price minor units */
  currentNightPriceCents: number;
};

export type PricingSuggestion = {
  kind: "hold" | "suggest_decrease" | "suggest_increase";
  suggestedNightPriceCents: number;
  deltaPercent: number;
  rationale: string;
};

const MAX_ADJUST_PCT = 12;

export function suggestPricingAdjustment(input: PricingSignalInput): PricingSuggestion {
  const { viewCount, bookingCount, occupancyRate, currentNightPriceCents } = input;
  if (currentNightPriceCents <= 0) {
    return {
      kind: "hold",
      suggestedNightPriceCents: currentNightPriceCents,
      deltaPercent: 0,
      rationale: "Invalid price — no suggestion.",
    };
  }

  const conversion = viewCount > 0 ? bookingCount / viewCount : 0;

  if (viewCount >= 30 && conversion < 0.02 && occupancyRate < 0.35) {
    const delta = -Math.min(MAX_ADJUST_PCT, 8);
    const next = Math.max(100, Math.round(currentNightPriceCents * (1 + delta / 100)));
    return {
      kind: "suggest_decrease",
      suggestedNightPriceCents: next,
      deltaPercent: delta,
      rationale: "High views but low conversion and occupancy — consider a modest price decrease.",
    };
  }

  if (occupancyRate >= 0.78 && conversion >= 0.05) {
    const delta = Math.min(MAX_ADJUST_PCT, 7);
    const next = Math.round(currentNightPriceCents * (1 + delta / 100));
    return {
      kind: "suggest_increase",
      suggestedNightPriceCents: next,
      deltaPercent: delta,
      rationale: "Strong occupancy and conversion — room to test a small price increase.",
    };
  }

  return {
    kind: "hold",
    suggestedNightPriceCents: currentNightPriceCents,
    deltaPercent: 0,
    rationale: "Signals neutral — hold price.",
  };
}
