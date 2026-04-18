/**
 * Revenue forecast — trailing trend extrapolation; not financial advice.
 */

import { prisma } from "@/lib/db";

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

export type RevenueForecast30d = {
  trailing7dRevenueCad: number;
  avgDailyCad: number;
  projectedNext30dCad: number;
  method: string;
};

export async function getRevenueForecast30d(): Promise<RevenueForecast30d> {
  const today = startOfUtcDay(new Date());
  const from = addUtcDays(today, -7);
  const to = addUtcDays(today, 1);

  const rows = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: from, lt: to },
      amount: { gt: 0 },
    },
    select: { amount: true },
  });

  let trailing7dRevenueCad = 0;
  for (const r of rows) {
    const a = Number(r.amount);
    if (Number.isFinite(a) && a > 0) trailing7dRevenueCad += a;
  }
  trailing7dRevenueCad = Math.round(trailing7dRevenueCad * 100) / 100;

  const avgDailyCad = Math.round((trailing7dRevenueCad / 7) * 100) / 100;
  const projectedNext30dCad = Math.round(avgDailyCad * 30 * 100) / 100;

  return {
    trailing7dRevenueCad,
    avgDailyCad,
    projectedNext30dCad,
    method: "Linear: last 7d platform revenue (RevenueEvent) ÷ 7 × 30",
  };
}
