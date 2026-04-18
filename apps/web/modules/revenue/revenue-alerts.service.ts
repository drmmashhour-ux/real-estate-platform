/**
 * Advisory strings derived from in-memory monitoring (V1).
 */

import { getRevenueMonitoringSnapshot } from "@/modules/revenue/revenue-monitoring.service";

export function getRevenueEnforcementAlerts(): string[] {
  const s = getRevenueMonitoringSnapshot();
  const warnings: string[] = [];

  const viewed = s.leadViews;
  const unlocked = s.leadsUnlockedPipeline;
  if (viewed > 0 && unlocked < viewed) {
    warnings.push(`${viewed - unlocked} lead detail view(s) without a recorded unlock checkout completion (pipeline)`);
  }

  if (s.bookingStarted > s.bookingCompleted && s.bookingStarted > 0) {
    const abandoned = s.bookingStarted - s.bookingCompleted;
    if (abandoned > 0) {
      warnings.push(`${abandoned} booking checkout start(s) without matching completed signals (in-memory)`);
    }
  }

  if (s.premiumInsightViews > 0 && s.blockedAccessCount > 0) {
    warnings.push(
      `${s.premiumInsightViews} premium insight view event(s) logged; ${s.blockedAccessCount} guard block(s) recorded`,
    );
  }

  if (s.eventsLogged === 0) {
    warnings.push("No revenue enforcement events recorded yet — enable FEATURE_REVENUE_ENFORCEMENT_V1 and exercise flows.");
  }

  return warnings;
}

/** Dashboard V1 — advisory alerts from {@link RevenueDashboardSummary} (read-only). */
export { detectRevenueAlerts } from "./revenue-dashboard-alerts.service";
