import { prisma } from "@/lib/db";

import { getAdminDashboardSummaryData } from "@/modules/dashboard/services/admin-dashboard.service";
import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";

import { sendTransactionalEmail } from "./notify";
import { sendExpoPushToAdminUsers } from "./push.service";

/** Builds plain-text executive summary — intended for cron / queue worker. */
export async function buildDailyExecutiveReportText(): Promise<string> {
  const [admin, revenue] = await Promise.all([getAdminDashboardSummaryData(), getRevenueDashboardData()]);
  const users = await prisma.user.count();

  const lines = [
    `LECIPM daily pulse`,
    `— Revenue today (platform share est.): ${(admin.revenueTodayCents / 100).toFixed(2)} CAD`,
    `— Bookings today: ${admin.bookingsToday}`,
    `— Leads today: ${admin.leadsToday}`,
    `— New users today: ${admin.newUsersToday}`,
    `— Risk signals (HIGH): ${admin.riskAlertsApprox}`,
    `— Rolling 7d avg revenue: ${(revenue.sevenDayAverageCents / 100).toFixed(2)} CAD`,
    `— Registered users (total): ${users}`,
  ];
  return lines.join("\n");
}

export async function sendDailyExecutiveReportEmail(to: string): Promise<boolean> {
  const body = await buildDailyExecutiveReportText();
  return sendTransactionalEmail(to, `LECIPM · Daily pulse`, body);
}

/** Email to `to` + Expo push to all admin device tokens. */
export async function sendDailyExecutiveReportAllChannels(to: string): Promise<{
  emailOk: boolean;
  pushOk: boolean;
}> {
  const body = await buildDailyExecutiveReportText();
  const emailOk = await sendTransactionalEmail(to, `LECIPM · Daily pulse`, body);
  const short = body.length > 400 ? `${body.slice(0, 380)}…` : body;
  const pushOk = await sendExpoPushToAdminUsers("LECIPM · Daily pulse", short);
  return { emailOk, pushOk };
}
