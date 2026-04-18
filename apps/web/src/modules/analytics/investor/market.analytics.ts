import { prisma } from "@/lib/db";

export type TopCityRow = { city: string; activeListings: number };

export async function topCitiesByActiveListings(limit = 12): Promise<TopCityRow[]> {
  const rows = await prisma.fsboListing.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ city: r.city, activeListings: r._count.id }));
}
