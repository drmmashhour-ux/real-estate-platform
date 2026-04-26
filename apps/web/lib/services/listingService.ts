import { authPrisma, getListingsDB, marketplacePrisma } from "@/lib/db";

/**
 * Cross-client “join”: Prisma cannot model relations across `listingsDB` and `authPrisma`.
 * DB foreign keys stay enforced in Postgres; we compose two point reads in the app layer.
 *
 * Uses `authPrisma` (users) + `listingsDB` (marketplace). The `@repo/db-core` client is a
 * minimal slice for rollout; full `User` lives in `@repo/db-auth` here.
 */
export async function getListingWithUser(listingId: string) {
  const listing = await getListingsDB().listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return null;

  const user = await authPrisma.user.findUnique({
    where: { id: listing.userId },
  });

  return { ...listing, user };
}

/**
 * Order 90 — marketplace `Listing` + `authPrisma` host row (shared `users` table).
 */
export async function getListingWithHost(listingId: string) {
  const listing = await marketplacePrisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return null;

  const host = await authPrisma.user.findUnique({
    where: { id: listing.userId },
  });

  return { ...listing, host };
}
