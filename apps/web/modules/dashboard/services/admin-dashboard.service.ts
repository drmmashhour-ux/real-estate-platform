import { prisma } from "@/lib/db";

import type { AdminDashboardSummaryData, RevenueDashboardData } from "../view-models";

import { getRevenueDashboardData, startOfUtcDayFromDate } from "./revenue-dashboard.service";

/** Uses pre-fetched revenue so callers can batch `getRevenueDashboardData()` once. */
export async function getAdminDashboardSummaryFromRevenue(
  revModule: RevenueDashboardData,
): Promise<AdminDashboardSummaryData> {
  const now = new Date();
  const todayStart = startOfUtcDayFromDate(now);
  const tomorrow = new Date(todayStart.getTime() + 86400000);

  const [users, bookings, leads, abuse] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: todayStart, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: todayStart, lt: tomorrow } },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: todayStart, lt: tomorrow } },
    }),
    prisma.abuseSignal.count({
      where: {
        severity: "HIGH",
        createdAt: { gte: todayStart, lt: tomorrow },
      },
    }),
  ]);

  return {
    revenueTodayCents: revModule.todayRevenueCents,
    bookingsToday: bookings,
    leadsToday: leads,
    newUsersToday: users,
    riskAlertsApprox: abuse,
  };
}

export async function getAdminDashboardSummaryData(): Promise<AdminDashboardSummaryData> {
  const revModule = await getRevenueDashboardData();
  return getAdminDashboardSummaryFromRevenue(revModule);
}
