import "server-only";

import { prisma } from "@/lib/db";

/**
 * Listing edit + compliance gates: listing owner (“user”), designated owner, collaborator access record, or platform admin.
 */
export async function canAccessCrmListingCompliance(userId: string, listingId: string): Promise<boolean> {
  const [listing, actor] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        userId: true,
        ownerId: true,
        brokerAccesses: {
          where: { brokerId: userId },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  if (!listing) return false;
  if (actor?.role === "ADMIN") return true;

  if (listing.userId === userId) return true;
  if (listing.ownerId !== null && listing.ownerId === userId) return true;
  return listing.brokerAccesses.length > 0;
}
