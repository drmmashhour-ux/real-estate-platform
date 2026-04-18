/**
 * LECIPM CRO — urgency helpers. Callers pass real metrics only; never invent numbers.
 */

export type BnhubUrgencyInput = {
  viewsToday: number;
  bookingsThisWeek: number;
  limitedAvailability: boolean;
};

export type BnhubUrgencyVisibility = {
  showViewsToday: boolean;
  showBookedThisWeek: boolean;
  showLimitedAvailability: boolean;
};

/** Which chips to render on the listing (each gate is independent). */
export function urgencyVisibilityFromMetrics(input: BnhubUrgencyInput): BnhubUrgencyVisibility {
  return {
    showViewsToday: input.viewsToday > 0,
    showBookedThisWeek: input.bookingsThisWeek > 0,
    showLimitedAvailability: input.limitedAvailability,
  };
}

export { evaluateUrgencyImpact } from "./cro-performance.service";
