import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";

const RECOMMENDED_UPLIFT_RATIO = 1.05;
const SOON_BOOK_DAYS = 28;

export type ResolveAiBookingInsightInput = {
  demandLevel: BnhubMarketInsightPayload["demandLevel"];
  peerListingCount: number;
  yourNightCents: number;
  recommendedNightCents: number;
  hasSelectedDates: boolean;
  leadDaysUntilCheckIn: number | null;
  /** Host calendar pressure around the guest’s dates (quote soft signal). */
  calendarTightForDates: boolean;
};

/**
 * 1–2 neutral lines for booking UI — uses marketplace demand, model anchor, lead time, and calendar data only.
 */
export function resolveAiBookingInsightLines(input: ResolveAiBookingInsightInput): string[] {
  const {
    demandLevel,
    peerListingCount,
    yourNightCents,
    recommendedNightCents,
    hasSelectedDates,
    leadDaysUntilCheckIn,
    calendarTightForDates,
  } = input;

  const lines: string[] = [];

  if (hasSelectedDates && (calendarTightForDates || demandLevel === "high")) {
    lines.push("High demand for selected dates");
  } else if (demandLevel === "high") {
    lines.push("High demand for stays in this area on BNHUB.");
  } else if (demandLevel === "medium" && peerListingCount >= 5 && lines.length === 0) {
    lines.push("Booking activity in this area has been steady.");
  }

  const lead = leadDaysUntilCheckIn;
  const soon = lead !== null && lead >= 0 && lead <= SOON_BOOK_DAYS;
  if (lines.length < 2 && soon && demandLevel !== "low") {
    lines.push("Best time to book is now.");
  }

  if (
    lines.length < 2 &&
    yourNightCents > 0 &&
    recommendedNightCents > yourNightCents * RECOMMENDED_UPLIFT_RATIO
  ) {
    lines.push("Prices expected to increase for comparable stays on BNHUB.");
  }

  return lines.slice(0, 2);
}
