import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

/** Simple week-over-week lead trend. */
export async function leadVolumeTrend() {
  const now = new Date();
  const w1 = subDays(now, 7);
  const w2 = subDays(now, 14);
  const [last7, prev7] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: w1 } } }),
    prisma.lead.count({ where: { createdAt: { gte: w2, lt: w1 } } }),
  ]);
  const deltaPct = prev7 <= 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 1000) / 10;
  return { last7, prev7, deltaPct };
}

export async function expansionCityTrend() {
  const rows = await prisma.monopolyExpansionCity.findMany({
    orderBy: { launchedAt: "desc" },
    take: 12,
    select: { slug: true, displayName: true, launchedAt: true, campaignsEnabled: true },
  });
  return rows;
}
