import { prisma } from "@/lib/db";

/** Surfaces listings with strong scores (existing metrics only). */
export async function topOpportunityListings(ownerUserId: string, take = 5) {
  const metrics = await prisma.fsboListingMetrics.findMany({
    where: { listing: { ownerId: ownerUserId } },
    orderBy: { engagementScore: "desc" },
    take,
    select: {
      fsboListingId: true,
      engagementScore: true,
      conversionScore: true,
      listing: { select: { title: true, city: true } },
    },
  });
  return metrics;
}
