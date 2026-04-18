import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 10_000) / 100;
}

/** Funnel from deterministic `growth_events` (ad-style journey). */
export async function getGrowthFunnelStats(days = 30) {
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -Math.max(1, Math.min(180, days)));
  const where = { createdAt: { gte: start, lt: end } };

  const [lpRows, signup, bookingStarted, bookingDone] = await Promise.all([
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM growth_events
      WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name = ${GrowthEventName.PAGE_VIEW}
        AND COALESCE(metadata::text, '') LIKE ${"%/lp/%"}
    `,
    prisma.growthEvent.count({ where: { ...where, eventName: GrowthEventName.SIGNUP_SUCCESS } }),
    prisma.growthEvent.count({ where: { ...where, eventName: GrowthEventName.BOOKING_STARTED } }),
    prisma.growthEvent.count({ where: { ...where, eventName: GrowthEventName.BOOKING_COMPLETED } }),
  ]);
  const lpView = Number(lpRows[0]?.c ?? 0);

  const steps = [
    { step: "lp_page_view", count: lpView },
    { step: "signup_success", count: signup },
    { step: "booking_started", count: bookingStarted },
    { step: "booking_completed", count: bookingDone },
  ];

  const funnel = steps.map((row, i) => {
    const prev = i > 0 ? steps[i - 1]!.count : null;
    const retentionFromPrior = prev != null && prev > 0 ? pct(row.count, prev) : null;
    return { ...row, retentionFromPrior };
  });

  return { range: { days, start: start.toISOString(), end: end.toISOString() }, funnel };
}
