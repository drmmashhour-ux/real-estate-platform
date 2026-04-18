/**
 * Prorates manual spend rows into ads performance windows (matches `ads-performance.service` date math).
 */
import { prisma } from "@/lib/db";

function windowBounds(rangeDays: number, offsetDays = 0): { since: Date; until: Date } {
  const until = new Date(Date.now() - offsetDays * 864e5);
  const since = new Date(until.getTime() - rangeDays * 864e5);
  return { since, until };
}

function overlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return Math.max(0, e - s);
}

export type ManualSpendAggregated = {
  /** Major currency units (e.g. CAD dollars), 2 decimal precision */
  totalDollars: number;
  /** Per UTM campaign key → dollars attributed to the window */
  byCampaign: Record<string, number>;
};

/**
 * Sum prorated spend for the same rolling window used by `getAdsPerformanceSummary` / `getAdsPerformanceByCampaign`.
 */
export async function getManualSpendAggregatedForAdsWindow(
  rangeDays: number,
  offsetDays = 0
): Promise<ManualSpendAggregated> {
  const { since, until } = windowBounds(rangeDays, offsetDays);
  const sinceMs = since.getTime();
  const untilMs = until.getTime();

  const rows = await prisma.growthOpsManualAdSpend.findMany({
    where: {
      AND: [{ periodStart: { lt: until } }, { periodEnd: { gt: since } }],
    },
    select: {
      utmCampaign: true,
      periodStart: true,
      periodEnd: true,
      spendCents: true,
    },
  });

  let totalCents = 0;
  const byCampaignCents = new Map<string, number>();

  for (const row of rows) {
    const rs = row.periodStart.getTime();
    const re = row.periodEnd.getTime();
    const rowDur = re - rs;
    if (rowDur <= 0) continue;

    const ov = overlapMs(rs, re, sinceMs, untilMs);
    if (ov <= 0) continue;

    const frac = ov / rowDur;
    const attributed = Math.round(row.spendCents * frac);
    totalCents += attributed;
    const key = row.utmCampaign.trim() || "(unset)";
    byCampaignCents.set(key, (byCampaignCents.get(key) ?? 0) + attributed);
  }

  const byCampaign: Record<string, number> = {};
  for (const [k, cents] of byCampaignCents) {
    byCampaign[k] = Math.round((cents / 100) * 100) / 100;
  }

  return {
    totalDollars: Math.round((totalCents / 100) * 100) / 100,
    byCampaign,
  };
}

export async function listGrowthOpsManualSpendRows(take = 50) {
  return prisma.growthOpsManualAdSpend.findMany({
    orderBy: { periodStart: "desc" },
    take,
  });
}
