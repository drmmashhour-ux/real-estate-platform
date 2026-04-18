import type { RevenueAlert, RevenueDashboardSummary } from "./revenue-dashboard.types";

const MAX_ALERTS = 12;

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

/** Reset deterministic ids for tests. */
export function resetRevenueDashboardAlertIdsForTests(): void {
  idSeq = 0;
}

/**
 * Bounded advisory alerts from a dashboard summary — no payment side effects.
 */
export function detectRevenueAlerts(summary: RevenueDashboardSummary): RevenueAlert[] {
  const out: RevenueAlert[] = [];

  const push = (level: RevenueAlert["level"], title: string, description: string) => {
    if (out.length >= MAX_ALERTS) return;
    out.push({ id: nextId("a"), level, title, description });
  };

  if (summary.revenueToday === 0) {
    push(
      "warning",
      "No revenue today",
      "No positive RevenueEvent amounts recorded for the current UTC day — verify checkout volume or event logging.",
    );
  }

  if (summary.leadsViewed > 0 && summary.leadsUnlocked === 0) {
    push(
      "warning",
      "Lead views are not converting into paid unlocks",
      "There are recorded lead views in-window but no unlocked leads — review unlock pricing, UX, or enforcement gates.",
    );
  }

  if (summary.leadsUnlocked > 0 && summary.payingBrokers === 0) {
    push(
      "warning",
      "Lead monetization without clear broker payers",
      "Unlocks exist but no broker-scoped payers were attributed in the revenue window — mapping may be incomplete.",
    );
  }

  if (summary.bookingStarts > 0 && summary.bookingCompleted === 0) {
    push(
      "warning",
      "Bookings are starting but not completing",
      "Funnel signals show starts without completions in-window — checkout or host readiness may need review (advisory).",
    );
  }

  if (summary.revenueWeek > 0 && summary.revenueWeek < 5 && summary.leadsViewed + summary.bookingStarts > 20) {
    push(
      "info",
      "Revenue is low relative to activity signals",
      "Traffic or funnel events exist but week revenue is minimal — confirm RevenueEvent coverage for all paid surfaces.",
    );
  }

  if (summary.leadUnlockRate > 0 && summary.leadUnlockRate < 0.05 && summary.leadsViewed >= 10) {
    push(
      "info",
      "Unlock rate is weak versus views",
      "Consider reviewing lead detail UX and unlock value proposition (no automatic changes).",
    );
  }

  return out;
}
