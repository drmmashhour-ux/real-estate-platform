/**
 * Bounded status classification from metrics + friction (explainable).
 */

import type {
  BNHubBookingFrictionSignal,
  BNHubGuestConversionStatus,
  BNHubListingConversionMetrics,
  BNHubSearchConversionMetrics,
} from "./guest-conversion.types";

export type StatusInput = {
  searchMetrics: BNHubSearchConversionMetrics;
  listingMetrics: BNHubListingConversionMetrics;
  frictionSignals: BNHubBookingFrictionSignal[];
};

function n(v: number | undefined): number {
  return v ?? 0;
}

export function classifyGuestConversionStatus(input: StatusInput): BNHubGuestConversionStatus {
  const { listingMetrics, searchMetrics, frictionSignals } = input;
  const high = frictionSignals.filter((f) => f.severity === "high").length;
  const med = frictionSignals.filter((f) => f.severity === "medium").length;

  const views = n(listingMetrics.listingViews);
  const starts = n(listingMetrics.bookingStarts);
  const paid = n(listingMetrics.bookingCompletions);
  const ctr = searchMetrics.clickThroughRate;
  const vts = listingMetrics.viewToStartRate;
  const stb = listingMetrics.startToBookingRate;

  if (high >= 2 || (stb != null && stb < 15 && starts >= 3)) {
    return "weak";
  }

  if (high >= 1 || med >= 3 || (vts != null && vts < 1.5 && views >= 20)) {
    return "watch";
  }

  if (
    paid >= 1 &&
    (ctr == null || ctr >= 4) &&
    (vts == null || vts >= 3) &&
    (stb == null || stb >= 35) &&
    high === 0 &&
    med <= 1
  ) {
    return "strong";
  }

  if (starts >= 1 && paid >= 1 && med <= 2 && high === 0) {
    return "healthy";
  }

  if (views < 5 && starts === 0 && paid === 0) {
    return "watch";
  }

  return "healthy";
}
