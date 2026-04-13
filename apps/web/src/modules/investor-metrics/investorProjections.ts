import { prisma } from "@/lib/db";
import { utcDayStart } from "./metricsEngine";

export type FinancialProjections = {
  generatedAt: string;
  /** Trailing 30d revenue from `revenue_event` (same basis as investor snapshot). */
  revenueTrailing30d: number;
  /** Prior 30d window (days 31–60 back from asOf day boundary). */
  revenuePrior30d: number | null;
  /** Month-over-month revenue growth (trailing vs prior), if prior > 0. */
  monthOverMonthRevenuePct: number | null;
  /** Trailing 30d × 12 — illustrative ARR-style figure. */
  annualRunRate: number;
  /** Simple 90d forward view: 3 × trailing 30d × (1 + MoM), or 3× if no MoM. */
  projectedRevenue90d: number;
  /** User growth MoM from snapshot inputs (optional). */
  monthOverMonthUsersPct: number | null;
  disclaimer: string;
};

/**
 * Loads prior-window revenue for MoM and builds illustrative projections (not GAAP guidance).
 */
export async function loadFinancialProjections(asOf: Date): Promise<FinancialProjections> {
  const end = utcDayStart(asOf);
  const trailingStart = new Date(end);
  trailingStart.setUTCDate(trailingStart.getUTCDate() - 30);
  const priorStart = new Date(trailingStart);
  priorStart.setUTCDate(priorStart.getUTCDate() - 30);

  const [trailingAgg, priorAgg, usersTrailing, usersPrior] = await Promise.all([
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: trailingStart, lte: asOf } },
      _sum: { amount: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: priorStart, lt: trailingStart } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: trailingStart, lte: asOf } } }),
    prisma.user.count({ where: { createdAt: { gte: priorStart, lt: trailingStart } } }),
  ]);

  const revenueTrailing30d = trailingAgg._sum.amount ?? 0;
  const revenuePrior30d = priorAgg._sum.amount ?? 0;
  const momRev =
    revenuePrior30d > 0 ? (revenueTrailing30d - revenuePrior30d) / revenuePrior30d : null;
  const momUsersPct =
    usersPrior > 0 ? ((usersTrailing - usersPrior) / usersPrior) * 100 : null;

  const growthFactor = momRev != null ? 1 + Math.max(momRev, -0.5) : 1;
  const projectedRevenue90d = revenueTrailing30d * 3 * growthFactor;

  return {
    generatedAt: new Date().toISOString(),
    revenueTrailing30d,
    revenuePrior30d: revenuePrior30d > 0 ? revenuePrior30d : null,
    monthOverMonthRevenuePct: momRev != null ? momRev * 100 : null,
    annualRunRate: revenueTrailing30d * 12,
    projectedRevenue90d,
    monthOverMonthUsersPct: momUsersPct,
    disclaimer:
      "Illustrative only: ARR = trailing 30d revenue × 12; 90d projection scales trailing 30d with capped MoM growth. Not financial advice or audited forecasts.",
  };
}

export function formatProjectionsForReport(p: FinancialProjections): string {
  const lines = [
    "Financial projections (illustrative)",
    `  Revenue trailing 30d (revenue_event): ${p.revenueTrailing30d.toFixed(2)}`,
    p.revenuePrior30d != null ? `  Revenue prior 30d: ${p.revenuePrior30d.toFixed(2)}` : "  Revenue prior 30d: n/a",
    p.monthOverMonthRevenuePct != null
      ? `  MoM revenue change: ${p.monthOverMonthRevenuePct >= 0 ? "+" : ""}${p.monthOverMonthRevenuePct.toFixed(1)}%`
      : "  MoM revenue change: n/a",
    `  Annual run rate (trailing × 12): ${p.annualRunRate.toFixed(2)}`,
    `  Projected revenue 90d (simple): ${p.projectedRevenue90d.toFixed(2)}`,
    p.monthOverMonthUsersPct != null
      ? `  MoM user signups change: ${p.monthOverMonthUsersPct >= 0 ? "+" : ""}${p.monthOverMonthUsersPct.toFixed(1)}%`
      : null,
    `  ${p.disclaimer}`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}
