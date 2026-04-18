/**
 * Event-style triggers from Money OS snapshot — deterministic, explainable.
 */

import type { AutomationTriggerId } from "./revenue-automation.types";
import type { MoneyOperatingSystemSnapshot } from "./money-os.types";

export type TriggerEvaluation = {
  id: AutomationTriggerId;
  fired: boolean;
  reason: string;
};

export function evaluateAutomationTriggers(snapshot: MoneyOperatingSystemSnapshot): TriggerEvaluation[] {
  const m = snapshot.meta;
  const traffic = m.leadsViewedWeek + m.bookingStartsWeek;
  const out: TriggerEvaluation[] = [];

  const revDrop =
    m.priorWeekTotalCad >= 80 &&
    snapshot.revenueWeek < m.priorWeekTotalCad * 0.55;
  out.push({
    id: "revenue_drop",
    fired: revDrop,
    reason: revDrop
      ? `Week revenue $${snapshot.revenueWeek.toFixed(0)} vs prior $${m.priorWeekTotalCad.toFixed(0)} (7d).`
      : "Week revenue not materially below prior 7d window.",
  });

  const convDrop =
    m.leadsViewedWeek >= 18 &&
    snapshot.revenueWeek > 0 &&
    m.leadsUnlockedWeek / Math.max(1, m.leadsViewedWeek) < 0.06;
  out.push({
    id: "conversion_drop",
    fired: convDrop,
    reason: convDrop
      ? `Unlock rate ~${((m.leadsUnlockedWeek / Math.max(1, m.leadsViewedWeek)) * 100).toFixed(1)}% with ${m.leadsViewedWeek} views.`
      : "Lead unlock rate not in critical band for trigger.",
  });

  const noActivity =
    snapshot.weekPositiveRevenueEvents === 0 &&
    traffic < 6 &&
    snapshot.revenueWeek < 1;
  out.push({
    id: "no_activity",
    fired: noActivity,
    reason: noActivity
      ? "Sparse revenue events and low funnel signals in-window."
      : "Activity or revenue events present.",
  });

  const hiTrafficLowRev =
    traffic >= 28 &&
    snapshot.revenueWeek < Math.max(120, m.priorWeekTotalCad * 0.35);
  out.push({
    id: "high_traffic_low_revenue",
    fired: hiTrafficLowRev,
    reason: hiTrafficLowRev
      ? `${traffic} views/starts vs $${snapshot.revenueWeek.toFixed(0)} week revenue.`
      : "Traffic vs revenue ratio below threshold.",
  });

  return out;
}
