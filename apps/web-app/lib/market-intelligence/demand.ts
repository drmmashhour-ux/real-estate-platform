/**
 * Demand metrics – booking volume, inventory, demand score by region/period.
 */

import { prisma } from "@/lib/db";

export async function computeDemandMetricsForRegion(
  marketRegionId: string,
  period: string
): Promise<{
  demandScore: number | null;
  searchVolume: number | null;
  bookingVolume: number | null;
  inventoryLevel: number | null;
}> {
  const propertyIds = await prisma.propertyIdentity.findMany({
    where: { marketRegionId },
    select: { id: true },
  }).then((r) => r.map((p) => p.id));
  if (propertyIds.length === 0) {
    return { demandScore: null, searchVolume: null, bookingVolume: null, inventoryLevel: 0 };
  }

  const listingIds = await prisma.shortTermListing.findMany({
    where: {
      propertyIdentityId: { in: propertyIds },
      listingStatus: "PUBLISHED",
    },
    select: { id: true },
  }).then((r) => r.map((l) => l.id));
  const inventoryLevel = listingIds.length;

  const [year, month] = period.split("-").map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const bookingVolume = await prisma.booking.count({
    where: {
      listingId: { in: listingIds },
      status: "COMPLETED",
      checkIn: { gte: periodStart, lte: periodEnd },
    },
  });

  const searchVolume = null;

  const demandScore =
    inventoryLevel > 0 && bookingVolume >= 0
      ? Math.min(100, Math.round((bookingVolume / Math.max(1, inventoryLevel)) * 20))
      : null;

  return { demandScore, searchVolume, bookingVolume, inventoryLevel };
}

export async function upsertDemandMetrics(
  marketRegionId: string,
  period: string,
  data: {
    demandScore?: number | null;
    searchVolume?: number | null;
    bookingVolume?: number | null;
    inventoryLevel?: number | null;
  }
) {
  return prisma.marketDemandMetrics.upsert({
    where: { marketRegionId_period: { marketRegionId, period } },
    create: {
      marketRegionId,
      period,
      demandScore: data.demandScore ?? undefined,
      searchVolume: data.searchVolume ?? undefined,
      bookingVolume: data.bookingVolume ?? undefined,
      inventoryLevel: data.inventoryLevel ?? undefined,
    },
    update: {
      demandScore: data.demandScore ?? undefined,
      searchVolume: data.searchVolume ?? undefined,
      bookingVolume: data.bookingVolume ?? undefined,
      inventoryLevel: data.inventoryLevel ?? undefined,
    },
  });
}

export async function getDemandMetrics(marketRegionId: string, options?: { limit?: number }) {
  return prisma.marketDemandMetrics.findMany({
    where: { marketRegionId },
    orderBy: { period: "desc" },
    take: options?.limit ?? 24,
  });
}
