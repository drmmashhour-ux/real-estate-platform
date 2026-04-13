import type { MetricSnapshot } from "@prisma/client";
import { prisma } from "@/lib/db";
import { utcDayStart } from "./metricsEngine";

export type MonthlyInvestorRollup = {
  monthLabel: string;
  year: number;
  month: number;
  /** Latest daily snapshot row falling inside the calendar month (UTC). */
  lastSnapshotInMonth: MetricSnapshot | null;
  /** Latest snapshot in the prior calendar month (for MoM deltas). */
  lastSnapshotInPriorMonth: MetricSnapshot | null;
};

/**
 * Resolves month boundaries in UTC and loads `MetricSnapshot` rows for monthly investor reporting.
 */
export async function loadMonthlyInvestorRollup(year: number, month: number): Promise<MonthlyInvestorRollup> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  const prevEndExclusive = start;

  const prevStart = new Date(Date.UTC(year, month - 2, 1));

  const [inMonth, priorMonth] = await Promise.all([
    prisma.metricSnapshot.findMany({
      where: { date: { gte: start, lt: endExclusive } },
      orderBy: { date: "desc" },
      take: 1,
    }),
    prisma.metricSnapshot.findMany({
      where: { date: { gte: prevStart, lt: prevEndExclusive } },
      orderBy: { date: "desc" },
      take: 1,
    }),
  ]);

  return {
    monthLabel: `${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
    lastSnapshotInMonth: inMonth[0] ?? null,
    lastSnapshotInPriorMonth: priorMonth[0] ?? null,
  };
}

export function formatMonthlyInvestorSummaryText(r: MonthlyInvestorRollup): string {
  const cur = r.lastSnapshotInMonth;
  const prev = r.lastSnapshotInPriorMonth;
  const lines = [
    `LECIPM — Monthly investor summary (${r.monthLabel})`,
    "",
    cur
      ? `Snapshot date (latest in month, UTC): ${utcDayStart(cur.date).toISOString().slice(0, 10)}`
      : "No MetricSnapshot rows for this month yet — run daily snapshot capture or wait for cron.",
    "",
  ];

  if (cur) {
    lines.push(
      "End-of-period metrics (from latest snapshot in month)",
      `  Total users: ${cur.totalUsers}`,
      `  Active users (30d touch, as-of snapshot logic): ${cur.activeUsers}`,
      `  Live listings (BNHUB + FSBO): ${cur.totalListings}`,
      `  Bookings (30d window in snapshot): ${cur.bookings}`,
      `  Revenue sum (30d window in snapshot): ${cur.revenue.toFixed(2)}`,
      `  Lead conversion (won/(won+lost)): ${(cur.conversionRate * 100).toFixed(1)}%`,
      "",
    );
  }

  if (cur && prev) {
    const du = cur.totalUsers - prev.totalUsers;
    const dr = cur.revenue - prev.revenue;
    lines.push(
      "Change vs prior month (latest snapshot vs prior month latest)",
      `  Users: ${du >= 0 ? "+" : ""}${du}`,
      `  Revenue (snapshot window sum): ${dr >= 0 ? "+" : ""}${dr.toFixed(2)}`,
      "",
    );
  }

  lines.push("LECIPM INVESTOR EXPORT");
  return lines.join("\n");
}
