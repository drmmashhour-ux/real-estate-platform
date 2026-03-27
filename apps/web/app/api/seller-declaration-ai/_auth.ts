import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export async function requireSellerOrAdminForListing(listingId: string) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401, userId: null, isAdmin: false };
  const admin = await isPlatformAdmin(userId);
  if (admin) return { ok: true as const, status: 200, userId, isAdmin: true };

  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId }, select: { ownerId: true } });
  if (!listing || listing.ownerId !== userId) return { ok: false as const, status: 403, userId, isAdmin: false };
  return { ok: true as const, status: 200, userId, isAdmin: false };
}
