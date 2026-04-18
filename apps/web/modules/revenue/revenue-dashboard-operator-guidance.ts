/**
 * Deterministic operator guidance — rules only, no ML.
 */

import type {
  OperatorChecklist,
  RevenueDashboardSummary,
  SparseDisplayState,
} from "./revenue-dashboard.types";

export function computeSparseDisplayState(summary: RevenueDashboardSummary): SparseDisplayState {
  const messages: string[] = [];
  let tier: SparseDisplayState["tier"] = "ok";

  const noMoney =
    summary.revenueToday === 0 &&
    summary.revenueWeek === 0 &&
    summary.weekPositiveRevenueEvents === 0;

  const sparseFunnel =
    summary.leadsViewed + summary.bookingStarts + summary.weekPositiveRevenueEvents < 8;

  if (noMoney) {
    tier = "empty";
    messages.push("No revenue events yet — amounts appear when paid RevenueEvent rows exist.");
  } else if (sparseFunnel && summary.leadUnlockRate === 0 && summary.leadsViewed < 5) {
    tier = "sparse";
    messages.push("Lead and conversion signals are still sparse.");
  }

  if (summary.bnhub.weekBookingFeeRevenue <= 0 && summary.bookingStarts > 0) {
    tier = tier === "ok" ? "sparse" : tier;
    messages.push("Booking revenue will appear once booking/payment events are recorded.");
  }

  const uniq = [...new Set(messages)].slice(0, 5);
  return { tier: uniq.length ? tier : "ok", messages: uniq.length ? uniq : [] };
}

/** Rules-based recommendations (max 5). */
export function buildOperatorActionRecommendations(summary: RevenueDashboardSummary): string[] {
  const out: string[] = [];
  const rs = summary.revenueBySource;
  const leadShare = summary.revenueWeek > 0 ? rs.lead_unlock / summary.revenueWeek : 0;

  if (summary.revenueWeek > 0 && leadShare < 0.25 && rs.lead_unlock >= 0) {
    out.push("Lead revenue is low — prioritize broker unlocks and unlock UX.");
  }
  if (rs.booking_fee <= 0 && summary.bookingStarts >= 3) {
    out.push("Booking revenue is flat — review BNHub funnel and fee capture logging.");
  }
  if (rs.boost <= 0 && rs.subscription <= 0 && summary.revenueWeek > 50) {
    out.push("Featured/boost revenue is inactive — promote listing boosts where applicable.");
  }
  if (summary.leadsViewed >= 15 && summary.leadUnlockRate < 0.08) {
    out.push("Lead views are high vs unlocks — shorten path to paid unlock.");
  }
  if (summary.bookingStarts >= 4 && summary.bookingCompletionRate < 0.3) {
    out.push("Booking completion drop-off — check guest checkout and host confirmations.");
  }

  return [...new Set(out)].slice(0, 5);
}

export function buildOperatorChecklist(
  summary: RevenueDashboardSummary,
  sortedAlerts: RevenueDashboardSummary["alerts"],
  recommendations: string[],
): OperatorChecklist {
  let todayFocus =
    summary.revenueToday === 0
      ? "Ship revenue today — unblock first paid events."
      : "Protect daily pace vs target and reinforce top sources.";

  if (sortedAlerts.length > 0 && sortedAlerts[0]) {
    todayFocus = `Priority: ${sortedAlerts[0].title}`;
  }

  const merged: string[] = [];
  if (sortedAlerts[0]) merged.push(sortedAlerts[0].title);
  for (const r of recommendations) {
    if (merged.length >= 3) break;
    merged.push(r);
  }

  const nBrokers = Math.min(Math.max(summary.activeBrokers, 5), 12);
  const fallback = [
    `Follow up ${nBrokers} brokers with open pipelines`,
    "Push featured listing offer to active sellers",
    "Review BNHub completion drop-off in checkout",
  ];
  let i = 0;
  while (merged.length < 3 && i < fallback.length) {
    const line = fallback[i]!;
    if (!merged.includes(line)) merged.push(line);
    i += 1;
  }

  return { todayFocus, topActions: merged.slice(0, 3) };
}
