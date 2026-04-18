/**
 * Executable money actions — deterministic copy from ranked problems + summary signals.
 */

import type { MoneyAction, RankedProblem } from "./money-os.types";
import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

function hashId(prefix: string, text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return `${prefix}-${h.toString(16)}`;
}

export function generateMoneyActions(
  summary: RevenueDashboardSummary,
  ranked: RankedProblem[],
): MoneyAction[] {
  const actions: MoneyAction[] = [];

  const nBrokers = Math.min(14, Math.max(6, summary.activeBrokers || 8));

  if (ranked.some((r) => r.title.includes("Lead") || r.title.includes("unlock"))) {
    actions.push({
      id: hashId("act", "brokers-unlock"),
      text: `Contact ${nBrokers} brokers — unlock pipeline check-ins`,
      rationale: "Lead revenue or unlock rate flagged.",
    });
  }

  if (ranked.some((r) => r.title.includes("featured") || r.title.includes("Featured"))) {
    actions.push({
      id: hashId("act", "featured"),
      text: "Push featured listing upsell to active sellers",
      rationale: "Boost/subscription stream weak or missing.",
    });
  }

  if (
    ranked.some(
      (r) =>
        r.title.includes("BNHub") ||
        r.title.includes("booking") ||
        r.title.includes("checkout") ||
        r.title.includes("Booking"),
    )
  ) {
    actions.push({
      id: hashId("act", "bnhub"),
      text: "Fix BNHub checkout drop-off (guest path + host confirmation)",
      rationale: "Booking funnel or fee capture flagged.",
    });
  }

  if (ranked.some((r) => r.title.includes("traffic") || r.title.includes("revenue capture"))) {
    actions.push({
      id: hashId("act", "instrument"),
      text: "Audit paid-step RevenueEvent coverage (unlock, booking fee)",
      rationale: "High activity vs low recorded revenue.",
    });
  }

  if (summary.revenueToday <= 0 && summary.revenueWeek < summary.dailyTargetCad * 3) {
    actions.push({
      id: hashId("act", "ship-today"),
      text: "Ship at least one paid conversion today (unlock or booking fee)",
      rationale: "No revenue today — unblock a paid path.",
    });
  }

  /** Supply hint — only when lead_unlock exists but volume low */
  if (summary.revenueBySource.lead_unlock > 0 && summary.leadsViewed < 12) {
    actions.push({
      id: hashId("act", "supply"),
      text: "Increase listing supply in top cities (broker outreach)",
      rationale: "Fewer lead views — thin supply signal.",
    });
  }

  const dedup = new Map<string, MoneyAction>();
  for (const a of actions) dedup.set(a.id, a);

  return [...dedup.values()].slice(0, 5);
}
