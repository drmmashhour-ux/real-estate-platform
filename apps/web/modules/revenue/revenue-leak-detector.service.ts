/**
 * Top revenue leaks — deterministic rules on dashboard summary + meta only.
 */

import type { RevenueLeak } from "./money-os.types";
import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

let leakSeq = 0;
function lid(): string {
  leakSeq += 1;
  return `leak-${leakSeq}`;
}

export function resetRevenueLeakIdsForTests(): void {
  leakSeq = 0;
}

export function detectTopRevenueLeaks(
  summary: RevenueDashboardSummary,
  priorWeekTotalCad: number,
  priorBookingCompleted: number,
): RevenueLeak[] {
  const out: RevenueLeak[] = [];

  const traffic = summary.leadsViewed + summary.bookingStarts;
  const rev = summary.revenueWeek;

  /** High activity, low revenue */
  if (traffic >= 28 && rev < Math.max(120, priorWeekTotalCad * 0.35)) {
    out.push({
      id: lid(),
      title: "High funnel traffic, weak revenue capture",
      detail: `${traffic} views/starts (7d) vs $${rev.toFixed(0)} week revenue — confirm RevenueEvent logging on paid steps.`,
      impactScore: 88,
    });
  }

  /** Lead unlock gap */
  if (summary.leadsViewed >= 18 && summary.leadUnlockRate < 0.07) {
    out.push({
      id: lid(),
      title: "Lead pipeline not monetizing",
      detail: `${summary.leadsViewed} lead views vs ${summary.leadsUnlocked} unlocks — tighten unlock path.`,
      impactScore: 91,
    });
  }

  /** Booking completion */
  if (summary.bookingStarts >= 5 && summary.bookingCompletionRate < 0.32) {
    out.push({
      id: lid(),
      title: "BNHub checkout drop-off",
      detail: `${summary.bookingStarts} starts / ${summary.bookingCompleted} completes (${(summary.bookingCompletionRate * 100).toFixed(0)}%) — review guest checkout.`,
      impactScore: 90,
    });
  }

  /** Booking revenue missing */
  if (summary.bookingStarts >= 4 && summary.bnhub.weekBookingFeeRevenue <= 0) {
    out.push({
      id: lid(),
      title: "Booking fees not hitting ledger",
      detail: "Starts exist but no booking_fee RevenueEvents in-window — verify Stripe → RevenueEvent.",
      impactScore: 86,
    });
  }

  /** Dead source: featured */
  const feat = summary.revenueBySource.boost + summary.revenueBySource.subscription;
  if (rev > 200 && feat <= 0) {
    out.push({
      id: lid(),
      title: "No featured / subscription revenue",
      detail: "Week revenue exists but boost/subscription streams are empty — run promoted listing push.",
      impactScore: 72,
    });
  }

  /** Week-over-week revenue collapse */
  if (priorWeekTotalCad >= 80 && rev < priorWeekTotalCad * 0.45) {
    out.push({
      id: lid(),
      title: "Week revenue down materially vs prior week",
      detail: `Was ~$${priorWeekTotalCad.toFixed(0)} prior 7d; now $${rev.toFixed(0)}.`,
      impactScore: 84,
    });
  }

  /** Booking completion count drop */
  if (priorBookingCompleted >= 4 && summary.bookingCompleted < Math.max(1, priorBookingCompleted * 0.4)) {
    out.push({
      id: lid(),
      title: "Completed bookings dropped",
      detail: `Prior week ${priorBookingCompleted} completions vs ${summary.bookingCompleted} now.`,
      impactScore: 82,
    });
  }

  return [...out].sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
}
