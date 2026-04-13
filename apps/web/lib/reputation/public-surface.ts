import { prisma } from "@/lib/db";
import { getReputationBadges } from "@/lib/reputation/get-public-badges";

export async function getReputationSurfaceForBnhubListing(listingId: string, ownerId: string) {
  const [listingRep, hostRep, listingBadges, hostBadges] = await Promise.all([
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType: "listing", entityId: listingId } },
    }),
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType: "host", entityId: ownerId } },
    }),
    getReputationBadges("listing", listingId),
    getReputationBadges("host", ownerId),
  ]);

  return {
    listing: listingRep,
    host: hostRep,
    listingBadges,
    hostBadges,
  };
}
