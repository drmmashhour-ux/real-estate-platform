/**
 * Financial control — revenue vs estimated fixed cost (env). Advisory P&L hint only.
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

export type FinanceControlSnapshot = {
  revenueCad30d: number;
  estimatedCostCad30d: number | null;
  profitCad30dEstimated: number | null;
  marginPercent: number | null;
  note: string;
};

function parseMonthlyOpsCost(): number | null {
  const raw = process.env.PLATFORM_EST_MONTHLY_OPS_COST_CAD?.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function getFinanceControlSnapshot(): Promise<FinanceControlSnapshot> {
  const to = addUtcDays(startOfUtcDay(new Date()), 1);
  const from = addUtcDays(to, -30);

  const rows = await prisma.revenueEvent.findMany({
    where: { createdAt: { gte: from, lt: to }, amount: { gt: 0 } },
    select: { amount: true },
    take: 80_000,
  });

  let revenueCad30d = 0;
  for (const r of rows) {
    const a = Number(r.amount);
    if (Number.isFinite(a) && a > 0) revenueCad30d += a;
  }
  revenueCad30d = Math.round(revenueCad30d * 100) / 100;

  const estimatedCostCad30d = parseMonthlyOpsCost();
  let profitCad30dEstimated: number | null = null;
  let marginPercent: number | null = null;

  if (estimatedCostCad30d != null) {
    profitCad30dEstimated = Math.round((revenueCad30d - estimatedCostCad30d) * 100) / 100;
    marginPercent =
      revenueCad30d > 0 ? Math.round((profitCad30dEstimated / revenueCad30d) * 10000) / 100 : null;
  }

  return {
    revenueCad30d,
    estimatedCostCad30d,
    profitCad30dEstimated,
    marginPercent,
    note:
      estimatedCostCad30d != null
        ? "Trailing 30d revenue vs monthly ops estimate (PLATFORM_EST_MONTHLY_OPS_COST_CAD) — not GAAP."
        : "Set PLATFORM_EST_MONTHLY_OPS_COST_CAD for profit estimate (infra + payroll proxy).",
  };
}
