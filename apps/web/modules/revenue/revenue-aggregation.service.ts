/**
 * LECIPM revenue aggregation — composes paid platform flows + broker lead payments + subscription mirrors.
 */

import type { LecipmMonetizationMetricsVm } from "./revenue.types";
import { getLecipmMonetizationSummary } from "./lecipm-monetization-summary.service";

export async function aggregateLecipmMonetizationMetrics(days = 30): Promise<LecipmMonetizationMetricsVm> {
  const base = await getLecipmMonetizationSummary(days);

  /** Subscriber cohort approximation for ARPU — workspace SaaS + broker SaaS mirrors. */
  const payingUsersApprox =
    base.activeWorkspaceSubscriptions + base.activeBrokerSaaS;
  const averageRevenuePerPayingUserCents =
    payingUsersApprox > 0 ? Math.round(base.totalPlatformCents / payingUsersApprox) : null;

  return {
    periodDays: days,
    periodStart: base.period.start,
    periodEnd: base.period.end,
    totalPlatformCents: base.totalPlatformCents,
    dailyAverageCents: base.dailyAverageCents,
    transactionCount: base.transactionCount,
    mrrCentsApprox: base.subscriptionMrrCentsApprox,
    activeWorkspaceSubscriptions: base.activeWorkspaceSubscriptions,
    activeBrokerSaaSSubscriptions: base.activeBrokerSaaS,
    brokerLeadRevenueCents: base.brokerLeadRevenueCents,
    revenueByHub: base.byHub.map((r) => ({
      hubKey: r.hubKey,
      hubLabel: r.hubLabel,
      platformCents: r.platformCents,
      transactionCount: r.transactionCount,
    })),
    averageRevenuePerPayingUserCents,
    payingUsersApprox,
  };
}
