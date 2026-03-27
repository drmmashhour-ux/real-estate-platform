import type { PrismaClient } from "@prisma/client";

/** 0–1 demand proxy from recent market data density for a city. */
export async function getCityDemand01(prisma: PrismaClient, city: string | null | undefined): Promise<number> {
  const c = city?.trim();
  if (!c) return 0.35;
  const n = await prisma.marketDataPoint.count({
    where: { city: { equals: c, mode: "insensitive" } },
  });
  return Math.min(1, n / 48);
}
