/**
 * Deterministic support-priority signals — advisory; no automated enforcement.
 */

import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";
import type { BrokerTeamRiskLevel } from "./broker-team.types";
import { recordBrokerTeamRiskFlag } from "./broker-team-monitoring.service";

const MS_DAY = 86400000;

export type BrokerTeamLeadRiskContext = {
  /** Leads in “contacted, no progression” with idle ≥ 72h (aligned with overdue follow-ups). */
  followUpsOverdue: number;
  /** Same cohort definition: stuck after outbound contact without reply signal. */
  stalledAfterContact: number;
  /** Days since any logged CRM touch on assigned leads (999 if none). */
  inactiveDaysApprox: number;
};

const REASON_BACKLOG = "High follow-up backlog";
const REASON_NO_ACTIVITY = "No recent activity";
const REASON_STUCK = "Leads stuck after contact";

function reasonsForBroker(
  metrics: BrokerPerformanceMetrics,
  ctx: BrokerTeamLeadRiskContext,
): string[] {
  const out: string[] = [];
  if (ctx.followUpsOverdue >= 3 || metrics.followUpsDue >= 6) {
    out.push(REASON_BACKLOG);
  }
  if (ctx.inactiveDaysApprox >= 7) {
    out.push(REASON_NO_ACTIVITY);
  }
  if (ctx.stalledAfterContact >= 4 && metrics.leadsAssigned >= 6) {
    out.push(REASON_STUCK);
  }
  return [...new Set(out)].slice(0, 4);
}

/**
 * Assigns risk level using fixed thresholds — stable across runs with the same inputs.
 */
export function assignBrokerTeamRiskLevel(
  metrics: BrokerPerformanceMetrics,
  ctx: BrokerTeamLeadRiskContext,
  nowMs: number,
): { riskLevel: BrokerTeamRiskLevel; reasons: string[] } {
  void nowMs;
  const reasons = reasonsForBroker(metrics, ctx);

  let riskLevel: BrokerTeamRiskLevel = "low";

  const overdueHeavy = ctx.followUpsOverdue >= 6 || metrics.followUpsDue >= 8;
  const veryQuiet = ctx.inactiveDaysApprox >= 14 || (metrics.leadsAssigned >= 8 && ctx.inactiveDaysApprox >= 10);
  const stalledHeavy =
    ctx.stalledAfterContact >= 8 && metrics.leadsAssigned >= 10 && metrics.overallScore < 52;

  if (overdueHeavy || veryQuiet || stalledHeavy) {
    riskLevel = "high";
  } else if (
    ctx.followUpsOverdue >= 2 ||
    metrics.followUpsDue >= 4 ||
    ctx.inactiveDaysApprox >= 7 ||
    ctx.stalledAfterContact >= 5 ||
    (metrics.avgResponseDelayHours != null &&
      metrics.avgResponseDelayHours > 36 &&
      metrics.activityScore < 62 &&
      metrics.leadsAssigned >= 6)
  ) {
    riskLevel = "medium";
  }

  try {
    recordBrokerTeamRiskFlag(riskLevel);
  } catch {
    /* monitoring never throws */
  }

  return { riskLevel, reasons: reasons.length > 0 ? reasons : [] };
}

export function inactiveDaysFromLastTouchMs(lastTouchMs: number, nowMs: number): number {
  if (lastTouchMs <= 0) return 999;
  return Math.max(0, Math.floor((nowMs - lastTouchMs) / MS_DAY));
}
