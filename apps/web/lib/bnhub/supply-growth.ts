import { prisma } from "@/lib/db";

/**
 * Record or update daily supply growth metrics (new listings, new hosts, referral signups).
 * Call from cron or after significant events; upserts by date.
 */
export async function recordSupplyGrowthMetric(params: {
  date: Date;
  newListings?: number;
  newHosts?: number;
  referralSignups?: number;
  totalListings?: number;
  totalHosts?: number;
}) {
  const dateOnly = new Date(params.date);
  dateOnly.setUTCHours(0, 0, 0, 0);
  const existing = await prisma.supplyGrowthMetric.findUnique({
    where: { date: dateOnly },
  });
  if (existing) {
    return prisma.supplyGrowthMetric.update({
      where: { date: dateOnly },
      data: {
        newListings: params.newListings ?? existing.newListings,
        newHosts: params.newHosts ?? existing.newHosts,
        referralSignups: params.referralSignups ?? existing.referralSignups,
        totalListings: params.totalListings ?? existing.totalListings,
        totalHosts: params.totalHosts ?? existing.totalHosts,
      },
    });
  }
  return prisma.supplyGrowthMetric.create({
    data: {
      date: dateOnly,
      newListings: params.newListings ?? 0,
      newHosts: params.newHosts ?? 0,
      referralSignups: params.referralSignups ?? 0,
      totalListings: params.totalListings ?? 0,
      totalHosts: params.totalHosts ?? 0,
    },
  });
}

/**
 * Get supply growth metrics for dashboard (e.g. last 30 days).
 */
export async function getSupplyGrowthMetrics(params: { days?: number } = {}) {
  const days = params.days ?? 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  return prisma.supplyGrowthMetric.findMany({
    where: { date: { gte: start } },
    orderBy: { date: "desc" },
  });
}

/**
 * Aggregate referral signups count (for acquisition tracking).
 */
export async function getReferralSignupsCount(params: { since?: Date } = {}) {
  const where = params.since ? { usedAt: { gte: params.since } } : {};
  return prisma.referral.count({
    where: { ...where, usedByUserId: { not: null } },
  });
}
