import { authPrisma, listingsDB } from "@/lib/db";

/**
 * Example cross-client read: Prisma cannot join `@repo/db-auth` User with `@repo/db-marketplace` Listing.
 */
export async function getUserWithMarketplaceListings(userId: string) {
  const user = await authPrisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const listings = await listingsDB.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { user, listings };
}
