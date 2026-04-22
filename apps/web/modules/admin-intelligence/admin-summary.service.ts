import { prisma } from "@/lib/db";
import type { RevenueDashboardData } from "@/modules/dashboard/view-models";
import { getRevenueDashboardData, startOfUtcDayFromDate } from "@/modules/dashboard/services/revenue-dashboard.service";
import { aggregateLecipmMonetizationMetrics } from "@/modules/revenue/revenue-aggregation.service";
import { getAdminDashboardSummaryFromRevenue } from "@/modules/dashboard/services/admin-dashboard.service";

import type { AdminGlobalStatsVm, HubPerformanceRow } from "./admin-intelligence.types";

export async function getAdminGlobalStats(): Promise<AdminGlobalStatsVm> {
  const rev = await getRevenueDashboardData();
  const { global } = await loadAdminGlobalBundle(rev);
  return global;
}

export type AdminGlobalBundle = {
  global: AdminGlobalStatsVm;
  summary: AdminDashboardSummaryData;
  agg: Awaited<ReturnType<typeof aggregateLecipmMonetizationMetrics>>;
};

/** Single round-trip for dashboard + insights (one revenue fetch). */
export async function loadAdminGlobalBundle(rev: RevenueDashboardData): Promise<AdminGlobalBundle> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d60 = new Date(now.getTime() - 60 * 86400000);

  const [agg, summary, users30, usersPrior, listings, careEvents, activeTotal] = await Promise.all([
    aggregateLecipmMonetizationMetrics(30),
    getAdminDashboardSummaryFromRevenue(rev),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.listing.count().catch(() => 0),
    prisma.careEvent.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.user.count().catch(() => 0),
  ]);

  let userGrowthPct: number | null = null;
  if (usersPrior > 0) {
    userGrowthPct = Math.round(((users30 - usersPrior) / usersPrior) * 1000) / 10;
  } else if (users30 > 0) {
    userGrowthPct = 100;
  }

  const global: AdminGlobalStatsVm = {
    totalRevenue30dCents: agg.totalPlatformCents,
    transactions30d: agg.transactionCount,
    activeUsersApprox: activeTotal,
    userGrowthPct,
    bookingsToday: summary.bookingsToday,
    leadsToday: summary.leadsToday,
    listingsTotalApprox: listings,
    residenceActivityCount: careEvents,
  };

  return { global, summary, agg };
}

export async function getAdminGlobalStatsFromRevenue(rev: RevenueDashboardData): Promise<AdminGlobalStatsVm> {
  const { global } = await loadAdminGlobalBundle(rev);
  return global;
}

export async function getHubPerformanceRows(): Promise<HubPerformanceRow[]> {
  const rev = await getRevenueDashboardData();
  return rev.revenueByHub.map((h) => ({
    hubKey: h.hubKey,
    hubLabel: h.hubLabel,
    revenueCents: h.amountCents,
    transactionCount: 0,
    deltaPctVsPriorDay: h.deltaPctVsPriorDay,
  }));
}
