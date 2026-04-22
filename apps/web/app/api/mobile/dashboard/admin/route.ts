import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import type { AdminDashboardSummaryData, MovementRowVm, RevenueDashboardData } from "@/modules/dashboard/view-models";
import {
  getAdminDashboardSummaryData,
  getMovementsDashboardData,
  getRevenueDashboardData,
} from "@/modules/dashboard/services";
import { formatCadCompactFromCents } from "@/modules/dashboard/services/format-dashboard-currency";

export const dynamic = "force-dynamic";

function buildAdminMobileInsights(
  summary: AdminDashboardSummaryData,
  revenue: RevenueDashboardData,
  movements: MovementRowVm[],
): string[] {
  const insights: string[] = [];

  if (revenue.sevenDayAverageCents > 0) {
    if (revenue.todayRevenueCents >= revenue.sevenDayAverageCents) {
      insights.push("Platform share is at or above the 7-day average.");
    } else {
      insights.push("Platform share is soft versus the 7-day rolling average.");
    }
  }

  const topHub = revenue.revenueByHub[0];
  if (topHub && topHub.amountCents > 0) {
    insights.push(`${topHub.hubLabel} leads today (${formatCadCompactFromCents(topHub.amountCents)} platform share).`);
  } else if (revenue.highestHubLabel !== "—") {
    insights.push(`${revenue.highestHubLabel} is the strongest hub today.`);
  }

  insights.push(`Today: ${formatCadCompactFromCents(revenue.todayRevenueCents)} · ${revenue.transactions} paid transactions.`);

  if (summary.riskAlertsApprox > 0) {
    insights.push(`${summary.riskAlertsApprox} high-severity signal(s) flagged for review today.`);
  }

  const latest = movements[0];
  if (latest) {
    insights.push(`${latest.hubLabel}: ${latest.detail}`);
  }

  return [...new Set(insights)].slice(0, 8);
}

/** Slim JSON for mobile admin monitoring — Bearer Supabase token + Prisma ADMIN role. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [summary, revenue, movements] = await Promise.all([
    getAdminDashboardSummaryData(),
    getRevenueDashboardData(),
    getMovementsDashboardData({ limit: 24 }),
  ]);

  const movementRows = movements.movements;
  const insights = buildAdminMobileInsights(summary, revenue, movementRows);

  return Response.json({
    summary,
    revenue,
    movements: movementRows,
    insights,
    /** Convenience envelope for compact mobile layouts (derived from summary + revenue). */
    stats: {
      revenueTodayDisplay: formatCadCompactFromCents(summary.revenueTodayCents),
      bookingsToday: summary.bookingsToday,
      leadsToday: summary.leadsToday,
      alertsApprox: summary.riskAlertsApprox,
      newUsersToday: summary.newUsersToday,
      transactionsToday: revenue.transactions,
      topHubLabel: revenue.revenueByHub[0]?.hubLabel ?? revenue.highestHubLabel,
    },
  });
}
