/**
 * Incentive-ready booleans — structure only; no payouts or gamification rewards.
 */

import type { BrokerIncentiveSignals, BrokerPerformanceMetrics } from "./broker-performance.types";

/** Without daily rollup tables, streak stays 0; reserved for future job. */
export function buildBrokerIncentiveSignals(metrics: BrokerPerformanceMetrics): BrokerIncentiveSignals {
  const highResponseDiscipline =
    metrics.disciplineScore >= 70 &&
    metrics.followUpsCompleted >= 4 &&
    metrics.followUpsDue <= 2;

  const strongMeetingProgression =
    metrics.leadsResponded > 0 &&
    metrics.meetingsMarked / metrics.leadsResponded >= 0.4 &&
    metrics.leadsAssigned >= 6;

  const decided = metrics.wonDeals + metrics.lostDeals;
  const steadyCloseRate =
    decided >= 4 &&
    metrics.wonDeals / decided >= 0.35 &&
    metrics.confidenceLevel !== "insufficient";

  const denseActivityWeek = metrics.leadsAssigned >= 10 && metrics.leadsContacted >= 6;

  return {
    consecutiveDaysFollowUpDiscipline: 0,
    highResponseDiscipline,
    strongMeetingProgression,
    steadyCloseRate,
    denseActivityWeek,
  };
}
