import type { PrismaClient } from "@prisma/client";
import { buildExecutiveSnapshot } from "@/lib/executive-metrics";
import { getTopPriorityLeads, type PriorityLeadRow } from "@/src/modules/crm/priorityQueue";
import { REVENUE_OPPORTUNITY_STATUS } from "@/src/modules/revenue/revenueEngine";
import { deriveCeoAlerts, type CeoAlert } from "@/modules/ceo-dashboard/alerts";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type CeoDashboardSnapshot = {
  totalUsers: number;
  activeUsers7d: number;
  bookingsToday: number;
  bookings7d: number;
  bookingsPrev7d: number;
  revenueTodayCents: number;
  gmvTodayCents: number;
  netRevenueYesterdayCents: number | null;
  bookingsYesterday: number | null;
  pipelineConversionPct: number | null;
  newLeads30d: number;
  wonLeads30d: number;
  openOpportunitiesCount: number;
  openOpportunitiesValueSum: number;
  trafficEvents24h: number;
  trafficEventsPrev24h: number;
  closeRoomTop: PriorityLeadRow[];
  alerts: CeoAlert[];
};

export async function getCeoDashboardSnapshot(db: PrismaClient): Promise<CeoDashboardSnapshot> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const d7 = addUtcDays(todayStart, -7);
  const d14 = addUtcDays(todayStart, -14);
  const d30 = addUtcDays(todayStart, -30);
  const h24 = new Date(now.getTime() - 24 * 3600 * 1000);
  const h48 = new Date(now.getTime() - 48 * 3600 * 1000);

  const [
    totalUsers,
    activeUsers7d,
    snapshotToday,
    snapshotYesterday,
    bookings7d,
    bookingsPrev7d,
    newLeads30d,
    wonLeads30d,
    openOppAgg,
    traffic24,
    trafficPrev24,
    closeRoomTop,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { updatedAt: { gte: d7 } } }),
    buildExecutiveSnapshot({ date: now, persist: false }),
    buildExecutiveSnapshot({ date: addUtcDays(now, -1), persist: false }),
    db.booking.count({
      where: { createdAt: { gte: d7 } },
    }),
    db.booking.count({
      where: { createdAt: { gte: d14, lt: d7 } },
    }),
    db.lead.count({ where: { createdAt: { gte: d30 } } }),
    db.lead.count({
      where: {
        pipelineStatus: "won",
        updatedAt: { gte: d30 },
      },
    }),
    db.revenueOpportunity.aggregate({
      where: { status: REVENUE_OPPORTUNITY_STATUS.open },
      _count: { _all: true },
      _sum: { valueEstimate: true },
    }),
    db.trafficEvent.count({ where: { createdAt: { gte: h24 } } }),
    db.trafficEvent.count({
      where: { createdAt: { gte: h48, lt: h24 } },
    }),
    getTopPriorityLeads(12),
  ]);

  const pipelineConversionPct =
    newLeads30d > 0 ? Math.round((wonLeads30d / newLeads30d) * 1000) / 10 : null;

  const alerts = deriveCeoAlerts({
    trafficEvents24h: traffic24,
    trafficEventsPrev24h: trafficPrev24,
    bookingsToday: snapshotToday.bookingsCount,
    hourUtc: now.getUTCHours(),
    newLeads30d,
    wonLeads30d,
    pipelineConversionPct,
    bookings7d,
    bookingsPrev7d,
  });

  return {
    totalUsers,
    activeUsers7d,
    bookingsToday: snapshotToday.bookingsCount,
    bookings7d,
    bookingsPrev7d,
    revenueTodayCents: snapshotToday.netRevenueCents,
    gmvTodayCents: snapshotToday.gmvCents,
    netRevenueYesterdayCents: snapshotYesterday.netRevenueCents,
    bookingsYesterday: snapshotYesterday.bookingsCount,
    pipelineConversionPct,
    newLeads30d,
    wonLeads30d,
    openOpportunitiesCount: openOppAgg._count._all,
    openOpportunitiesValueSum: openOppAgg._sum.valueEstimate ?? 0,
    trafficEvents24h: traffic24,
    trafficEventsPrev24h: trafficPrev24,
    closeRoomTop,
    alerts,
  };
}
