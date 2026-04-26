import { authPrisma, listingsDB, marketplacePrisma, monolithPrisma } from "@/lib/db";

/**
 * Cross-client “join”: Prisma cannot model relations across `listingsDB` and `authPrisma`.
 * DB foreign keys stay enforced in Postgres; we compose two point reads in the app layer.
 *
 * Uses `authPrisma` (users) + `listingsDB` (marketplace). The `@repo/db-core` client is a
 * minimal slice for rollout; full `User` lives in `@repo/db-auth` here.
 */
export async function getListingWithUser(listingId: string) {
  const listing = await listingsDB.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return null;

  const user = await authPrisma.user.findUnique({
    where: { id: listing.userId },
  });

  return { ...listing, user };
}

/**
 * Order 90 — Split marketplace `Listing` + monolith `User` (host profile, Stripe Connect, etc.).
 * Same instance as `listingsDB` / `marketplacePrisma`; host row is only on the monolith schema.
 */
export async function getListingWithHost(listingId: string) {
  const listing = await marketplacePrisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return null;

  const host = await monolithPrisma.user.findUnique({
    where: { id: listing.userId },
  });

  return { ...listing, host };
}
