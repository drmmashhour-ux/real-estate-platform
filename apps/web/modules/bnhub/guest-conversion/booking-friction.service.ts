/**
 * Deterministic, explainable friction signals (advisory).
 */

import type { BNHubBookingFrictionSignal, GuestConversionFrictionContext } from "./guest-conversion.types";

function num(n: number | undefined): number {
  return n ?? 0;
}

/**
 * Detects funnel / trust / quality friction from read-only metrics (no side effects).
 */
export function detectBookingFrictionSignals(input: GuestConversionFrictionContext): BNHubBookingFrictionSignal[] {
  const out: BNHubBookingFrictionSignal[] = [];
  const views = num(input.listingMetrics.listingViews);
  const starts = num(input.listingMetrics.bookingStarts);
  const paid = num(input.listingMetrics.bookingCompletions);
  const vts = input.listingMetrics.viewToStartRate;
  const stb = input.listingMetrics.startToBookingRate;

  if (views >= 10 && starts <= 1) {
    out.push({
      title: "Listing page → booking start gap",
      severity: views >= 40 && starts === 0 ? "high" : "medium",
      why: `Observed ${views} tracked listing views vs ${starts} booking funnel starts in the window — guests may hesitate on details, dates, or trust.`,
    });
  }

  if (starts >= 3 && paid === 0) {
    out.push({
      title: "Checkout / payment step friction",
      severity: starts >= 8 ? "high" : "medium",
      why: `Booking starts (${starts}) did not reach completed paid events (${paid}) in the window — review checkout UX, fees disclosure, and Stripe readiness (advisory).`,
    });
  }

  if (input.reviewCount === 0 && views >= 5) {
    out.push({
      title: "Trust signal gap",
      severity: "medium",
      why: "Guests see meaningful traffic but there are no guest reviews yet — social proof may lag demand.",
    });
  }

  if (input.photoCount < 3) {
    out.push({
      title: "Visual completeness",
      severity: input.photoCount === 0 ? "high" : "medium",
      why: `Only ${input.photoCount} photo(s) detected in listing payload — richer galleries often improve click-through and confidence.`,
    });
  }

  if (!input.hasDescription || input.nightPriceCents <= 0) {
    out.push({
      title: "Listing completeness",
      severity: "low",
      why: "Description or nightly price signals look thin — incomplete pages can increase bounce before booking start.",
    });
  }

  if (vts != null && vts < 2 && views >= 15) {
    out.push({
      title: "Low view-to-start rate",
      severity: "medium",
      why: `View-to-start rate is about ${vts.toFixed(1)}% — guests open the listing but rarely begin booking.`,
    });
  }

  if (stb != null && stb < 25 && starts >= 2) {
    out.push({
      title: "Low start-to-completion rate",
      severity: "high",
      why: `Only about ${stb.toFixed(0)}% of starts reach a paid completion in the window — investigate funnel drop-off (advisory).`,
    });
  }

  const seen = new Set<string>();
  return out.filter((s) => {
    const k = `${s.title}:${s.why}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
