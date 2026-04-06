import { prisma } from "@/lib/db";

export async function getLatestListingIntelligenceSnapshot(listingId: string) {
  return prisma.listingIntelligenceSnapshot.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
}
