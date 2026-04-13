import { prisma } from "@/lib/db";

/**
 * Resolves the broker user for a CRM listing: optional preferred broker must match
 * `BrokerListingAccess` or `listing.ownerId`.
 */
export async function resolveBrokerForListing(
  listingId: string,
  preferredBrokerId?: string | null
): Promise<string | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return null;

  if (preferredBrokerId) {
    const access = await prisma.brokerListingAccess.findFirst({
      where: { listingId, brokerId: preferredBrokerId },
    });
    if (access) return preferredBrokerId;
    if (listing.ownerId && listing.ownerId === preferredBrokerId) return preferredBrokerId;
    return null;
  }

  const access = await prisma.brokerListingAccess.findFirst({
    where: { listingId },
    orderBy: { grantedAt: "asc" },
  });
  if (access) return access.brokerId;
  return listing.ownerId ?? null;
}
