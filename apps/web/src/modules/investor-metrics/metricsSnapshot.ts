import { prisma } from "@/lib/db";
import { aggregateSnapshotInputs, utcDayStart } from "./metricsEngine";

/**
 * Capture platform metrics and upsert the row for the given UTC calendar day.
 */
export async function captureAndStoreMetricSnapshot(asOf: Date = new Date()): Promise<{ date: Date; id: string }> {
  const day = utcDayStart(asOf);
  const row = await aggregateSnapshotInputs(asOf);

  const saved = await prisma.metricSnapshot.upsert({
    where: { date: day },
    create: {
      date: day,
      totalUsers: row.totalUsers,
      activeUsers: row.activeUsers,
      totalListings: row.totalListings,
      bookings: row.bookings,
      revenue: row.revenue,
      conversionRate: row.conversionRate,
    },
    update: {
      totalUsers: row.totalUsers,
      activeUsers: row.activeUsers,
      totalListings: row.totalListings,
      bookings: row.bookings,
      revenue: row.revenue,
      conversionRate: row.conversionRate,
    },
  });

  return { date: saved.date, id: saved.id };
}

export async function getRecentMetricSnapshots(limit = 90) {
  return prisma.metricSnapshot.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}
