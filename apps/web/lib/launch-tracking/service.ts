import { prisma } from "@/lib/db";
import {
  emptyTotals,
  LAUNCH_METRIC_KEYS,
  type LaunchDailyRow,
  type LaunchMetricKey,
} from "@/lib/launch-tracking/metrics";
import { generateLaunchDailyReport } from "@/lib/launch-tracking/generateLaunchDailyReport";
import { toUtcDateOnly } from "@/lib/launch-tracking/utc-day";

/** Sum daily rows into period totals (used by dashboard and tests). */
export function sumLaunchSeries(series: LaunchDailyRow[]): Record<LaunchMetricKey, number> {
  const totals = emptyTotals();
  for (const r of series) {
    for (const k of LAUNCH_METRIC_KEYS) {
      totals[k] += r[k];
    }
  }
  return totals;
}

function rowToDto(r: {
  date: Date;
  messagesSent: number;
  repliesReceived: number;
  demosBooked: number;
  demosCompleted: number;
  usersCreated: number;
  activatedUsers: number;
  payingUsers: number;
  postsCreated: number;
  contentViews: number;
  contentClicks: number;
  contentConversions: number;
}): LaunchDailyRow {
  return {
    date: r.date.toISOString().slice(0, 10),
    messagesSent: r.messagesSent,
    repliesReceived: r.repliesReceived,
    demosBooked: r.demosBooked,
    demosCompleted: r.demosCompleted,
    usersCreated: r.usersCreated,
    activatedUsers: r.activatedUsers,
    payingUsers: r.payingUsers,
    postsCreated: r.postsCreated,
    contentViews: r.contentViews,
    contentClicks: r.contentClicks,
    contentConversions: r.contentConversions,
  };
}

export async function incrementLaunchMetric(args: {
  metric: LaunchMetricKey;
  delta: number;
  date?: Date;
}): Promise<LaunchDailyRow> {
  const day = args.date ? toUtcDateOnly(args.date) : toUtcDateOnly(new Date());
  const d = Math.trunc(args.delta);
  if (!Number.isFinite(d) || d === 0) {
    const existing = await prisma.launchPhaseDailyStats.findUnique({ where: { date: day } });
    if (existing) return rowToDto(existing);
    const created = await prisma.launchPhaseDailyStats.create({
      data: { date: day },
    });
    return rowToDto(created);
  }

  const updated = await prisma.launchPhaseDailyStats.upsert({
    where: { date: day },
    create: { date: day, [args.metric]: d },
    update: { [args.metric]: { increment: d } },
  });
  return rowToDto(updated);
}

export async function getLaunchTrackingPayload(days: number) {
  const n = Math.min(90, Math.max(7, days));
  const end = toUtcDateOnly(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (n - 1));

  const rows = await prisma.launchPhaseDailyStats.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const totals = emptyTotals();
  const series = rows.map(rowToDto);
  for (const r of series) {
    for (const k of Object.keys(totals) as LaunchMetricKey[]) {
      totals[k] += r[k];
    }
  }

  const report = generateLaunchDailyReport(series);

  return { series, totals, report, rangeDays: n };
}
