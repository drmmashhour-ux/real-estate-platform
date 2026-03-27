/**
 * Aggregated market stats for dashboards (rule-based SQL, not predictive AI).
 */

import { prisma } from "@/lib/db";

export type HotZone = {
  city: string;
  listingCount: number;
  avgNightPriceCents: number;
  label: string;
};

export async function computeHotZones(limit = 8): Promise<HotZone[]> {
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: "PUBLISHED" },
    _count: { id: true },
    _avg: { nightPriceCents: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return rows.map((r) => ({
    city: r.city,
    listingCount: r._count.id,
    avgNightPriceCents: Math.round(r._avg.nightPriceCents ?? 0),
    label:
      r._count.id >= 20
        ? "High supply"
        : r._count.id >= 10
          ? "Active"
          : "Emerging",
  }));
}

export async function trendingAreasByRecentListings(days = 14, limit = 6): Promise<{ city: string; newListings: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ city: r.city, newListings: r._count.id }));
}
