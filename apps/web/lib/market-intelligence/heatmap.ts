/**
 * Heatmap data for visualization – demand, price, rent, BNHUB revenue by region.
 */

import { prisma } from "@/lib/db";
import type { HeatmapZone } from "./types";

export type HeatmapMetric = "demand" | "price" | "rent" | "bnhub_revenue" | "investment";

export async function getHeatmapData(
  regionType: string,
  metric: HeatmapMetric,
  period?: string
): Promise<HeatmapZone[]> {
  const regions = await prisma.marketRegion.findMany({
    where: { regionType },
    include: {
      _count: { select: { propertyIdentities: true } },
    },
  });
  if (regions.length === 0) return [];

  const latestPeriod =
    period ??
    (await prisma.marketPriceIndex.findFirst({ orderBy: { period: "desc" }, select: { period: true } }))?.period ??
    "";

  const [priceRows, rentRows, bnhubRows, demandRows] = await Promise.all([
    prisma.marketPriceIndex.findMany({
      where: { marketRegionId: { in: regions.map((r) => r.id) }, period: latestPeriod },
    }),
    prisma.marketRentIndex.findMany({
      where: { marketRegionId: { in: regions.map((r) => r.id) }, period: latestPeriod },
    }),
    prisma.marketBnhubIndex.findMany({
      where: { marketRegionId: { in: regions.map((r) => r.id) }, period: latestPeriod },
    }),
    prisma.marketDemandMetrics.findMany({
      where: { marketRegionId: { in: regions.map((r) => r.id) }, period: latestPeriod },
    }),
  ]);
  const priceByRegion = new Map(priceRows.map((r) => [r.marketRegionId, r]));
  const rentByRegion = new Map(rentRows.map((r) => [r.marketRegionId, r]));
  const bnhubByRegion = new Map(bnhubRows.map((r) => [r.marketRegionId, r]));
  const demandByRegion = new Map(demandRows.map((r) => [r.marketRegionId, r]));

  const zones: HeatmapZone[] = regions.map((r) => {
    const price = priceByRegion.get(r.id);
    const rent = rentByRegion.get(r.id);
    const bnhub = bnhubByRegion.get(r.id);
    const demand = demandByRegion.get(r.id);
    const zone: HeatmapZone = {
      regionId: r.id,
      regionName: r.name,
      regionType: r.regionType,
    };
    if (metric === "demand" && demand) {
      zone.demandScore = demand.demandScore ?? undefined;
      zone.averageMonthlyRevenue = bnhub?.averageMonthlyRevenue ?? undefined;
    }
    if (metric === "price" && price) zone.averagePrice = price.averagePrice ?? undefined;
    if (metric === "rent" && rent) zone.averageRent = rent.averageRent ?? undefined;
    if (metric === "bnhub_revenue" && bnhub) {
      zone.averageNightlyRate = bnhub.averageNightlyRate ?? undefined;
      zone.averageMonthlyRevenue = bnhub.averageMonthlyRevenue ?? undefined;
    }
    if (metric === "investment") {
      zone.averagePrice = price?.averagePrice ?? undefined;
      zone.averageRent = rent?.averageRent ?? undefined;
      zone.averageMonthlyRevenue = bnhub?.averageMonthlyRevenue ?? undefined;
      zone.demandScore = demand?.demandScore ?? undefined;
    }
    return zone;
  });

  if (metric === "investment") {
    const scores = await prisma.marketInvestmentScore.findMany({
      where: { marketRegionId: { in: regions.map((r) => r.id) } },
      distinct: ["propertyIdentityId"],
      orderBy: { createdAt: "desc" },
      include: { propertyIdentity: { select: { id: true, marketRegionId: true } } },
    });
    const avgByRegion = new Map<string, { sum: number; count: number }>();
    for (const s of scores) {
      const rid = s.marketRegionId;
      const cur = avgByRegion.get(rid) ?? { sum: 0, count: 0 };
      cur.sum += s.investmentScore;
      cur.count += 1;
      avgByRegion.set(rid, cur);
    }
    for (const z of zones) {
      const avg = avgByRegion.get(z.regionId);
      if (avg && avg.count > 0) z.investmentScore = Math.round(avg.sum / avg.count);
    }
  }

  return zones;
}
