import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listRegions } from "@/lib/market-intelligence";

/**
 * GET /api/admin/market/overview
 * Regional price/rent/BNHUB summary and anomaly hints for admin console.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const regions = await listRegions();
    const period = new Date();
    const periodStr = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, "0")}`;

    const [priceRows, rentRows, bnhubRows, demandRows] = await Promise.all([
      prisma.marketPriceIndex.findMany({
        where: { period: periodStr, marketRegionId: { in: regions.map((r) => r.id) } },
      }),
      prisma.marketRentIndex.findMany({
        where: { period: periodStr, marketRegionId: { in: regions.map((r) => r.id) } },
      }),
      prisma.marketBnhubIndex.findMany({
        where: { period: periodStr, marketRegionId: { in: regions.map((r) => r.id) } },
      }),
      prisma.marketDemandMetrics.findMany({
        where: { period: periodStr, marketRegionId: { in: regions.map((r) => r.id) } },
      }),
    ]);

    const priceByRegion = new Map(priceRows.map((r) => [r.marketRegionId, r]));
    const rentByRegion = new Map(rentRows.map((r) => [r.marketRegionId, r]));
    const bnhubByRegion = new Map(bnhubRows.map((r) => [r.marketRegionId, r]));
    const demandByRegion = new Map(demandRows.map((r) => [r.marketRegionId, r]));

    const summaries = regions.map((r) => {
      const price = priceByRegion.get(r.id);
      const rent = rentByRegion.get(r.id);
      const bnhub = bnhubByRegion.get(r.id);
      const demand = demandByRegion.get(r.id);
      return {
        regionId: r.id,
        regionName: r.name,
        regionType: r.regionType,
        priceTrend: price?.trendDirection ?? null,
        averagePrice: price?.averagePrice ?? null,
        rentTrend: rent?.trendDirection ?? null,
        averageRent: rent?.averageRent ?? null,
        bnhubNightly: bnhub?.averageNightlyRate ?? null,
        bnhubOccupancy: bnhub?.averageOccupancy ?? null,
        demandScore: demand?.demandScore ?? null,
        bookingVolume: demand?.bookingVolume ?? null,
        inventoryLevel: demand?.inventoryLevel ?? null,
      };
    });

    const prices = priceRows.map((r) => r.averagePrice).filter((p): p is number => p != null);
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    const anomalies = summaries.filter((s) => {
      if (s.averagePrice != null && avgPrice != null && avgPrice > 0) {
        const pct = Math.abs((s.averagePrice - avgPrice) / avgPrice);
        if (pct > 0.5) return true;
      }
      return false;
    });

    return Response.json({
      period: periodStr,
      regionCount: regions.length,
      summaries,
      anomalies: anomalies.map((a) => ({ ...a, reason: "Price deviation from regional average" })),
    });
  } catch (e) {
    return Response.json({ error: "Failed to load market overview" }, { status: 500 });
  }
}
