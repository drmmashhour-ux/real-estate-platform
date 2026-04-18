/**
 * $1K/month revenue target — read-only sums from `RevenueEvent` (no payment logic changes).
 */

import { prisma } from "@/lib/db";

export const GROWTH_MONTHLY_TARGET_CAD = 1000;

export type RevenueTargetStatus = {
  monthlyTarget: typeof GROWTH_MONTHLY_TARGET_CAD;
  currentRevenue: number;
  remaining: number;
  progressPercent: number;
};

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addUtcMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 0, 0, 0, 0));
}

export async function buildRevenueTargetStatus(): Promise<RevenueTargetStatus> {
  const now = new Date();
  const monthStart = startOfUtcMonth(now);
  const nextMonthStart = addUtcMonths(monthStart, 1);

  const rows = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: monthStart, lt: nextMonthStart },
      amount: { gt: 0 },
    },
    select: { amount: true },
  });

  let currentRevenue = 0;
  for (const r of rows) {
    const a = Number(r.amount);
    if (Number.isFinite(a) && a > 0) currentRevenue += a;
  }

  const remaining = Math.max(0, GROWTH_MONTHLY_TARGET_CAD - currentRevenue);
  const progressPercent = Math.min(100, (currentRevenue / GROWTH_MONTHLY_TARGET_CAD) * 100);

  return {
    monthlyTarget: GROWTH_MONTHLY_TARGET_CAD,
    currentRevenue,
    remaining,
    progressPercent,
  };
}
