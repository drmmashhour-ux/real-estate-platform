import { prisma } from "@/lib/db";
import { getChurnRate, type ChurnWindow } from "../application/getChurnRate";
import { getLTV } from "../application/getLTV";
import { getMRR } from "../application/getMRR";
import type { RevenueChurnResult, RevenueLTVResult, RevenueMRRResult } from "../domain/revenueTypes";

export async function fetchRevenueMetrics(options?: { churnWindow?: ChurnWindow }): Promise<{
  mrr: RevenueMRRResult;
  churn: RevenueChurnResult;
  ltv: RevenueLTVResult;
}> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  const window = options?.churnWindow ?? { start, end };

  const [mrr, churn, ltv] = await Promise.all([
    getMRR(prisma),
    getChurnRate(prisma, window),
    getLTV(prisma),
  ]);

  return { mrr, churn, ltv };
}

/**
 * Persist a daily snapshot (idempotent on `snapshotDate` unique).
 */
export async function persistRevenueSnapshot(date: Date): Promise<void> {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const { mrr, churn, ltv } = await fetchRevenueMetrics();

  await prisma.revenueSnapshot.upsert({
    where: { snapshotDate: day },
    create: {
      snapshotDate: day,
      mrr: mrr.mrr != null ? mrr.mrr : null,
      churnRate: churn.churnRate != null ? churn.churnRate : null,
      ltv: ltv.ltv != null ? ltv.ltv : null,
    },
    update: {
      mrr: mrr.mrr != null ? mrr.mrr : null,
      churnRate: churn.churnRate != null ? churn.churnRate : null,
      ltv: ltv.ltv != null ? ltv.ltv : null,
    },
  });
}
