import type { ExecutionDay } from "@prisma/client";
import { prisma } from "@/lib/db";
import { REVENUE_GOAL_USD } from "./constants";

export type ProgressSnapshot = {
  totalRevenue: number;
  pctTowardGoal: number;
  avgDailyRevenue: number;
  avgDailyMessages: number;
  avgDailyBrokers: number;
  avgDailyBookings: number;
};

export function computeProgressForDays(days: ExecutionDay[], revenueGoal = REVENUE_GOAL_USD): ProgressSnapshot {
  if (days.length === 0) {
    return {
      totalRevenue: 0,
      pctTowardGoal: 0,
      avgDailyRevenue: 0,
      avgDailyMessages: 0,
      avgDailyBrokers: 0,
      avgDailyBookings: 0,
    };
  }

  const n = days.length;
  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const totalMessages = days.reduce((s, d) => s + d.messagesSent, 0);
  const totalBrokers = days.reduce((s, d) => s + d.brokersContacted, 0);
  const totalBookings = days.reduce((s, d) => s + d.bookingsCompleted, 0);

  return {
    totalRevenue,
    pctTowardGoal: revenueGoal > 0 ? Math.min(100, (totalRevenue / revenueGoal) * 100) : 0,
    avgDailyRevenue: totalRevenue / n,
    avgDailyMessages: totalMessages / n,
    avgDailyBrokers: totalBrokers / n,
    avgDailyBookings: totalBookings / n,
  };
}

export async function aggregateExecutionAllTime() {
  const sumRow = await prisma.executionDay.aggregate({
    _sum: {
      revenue: true,
      messagesSent: true,
      brokersContacted: true,
      bookingsCompleted: true,
    },
  });
  const dayCount = await prisma.executionDay.count();
  const totalRevenue = sumRow._sum.revenue ?? 0;
  return {
    totalRevenue,
    totalMessages: sumRow._sum.messagesSent ?? 0,
    totalBrokers: sumRow._sum.brokersContacted ?? 0,
    totalBookings: sumRow._sum.bookingsCompleted ?? 0,
    dayCount,
    pctTowardGoal: REVENUE_GOAL_USD > 0 ? Math.min(100, (totalRevenue / REVENUE_GOAL_USD) * 100) : 0,
  };
}
