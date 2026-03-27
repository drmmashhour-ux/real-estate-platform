import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function assertListingOwnerOrAdmin(listingId: string): Promise<
  { ok: true; userId: string } | { ok: false; status: 401 | 403 | 404; message: string }
> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, status: 401, message: "Unauthorized" };

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return { ok: false, status: 404, message: "Not found" };

  const isAdmin = await isPlatformAdmin(userId);
  if (listing.ownerId !== userId && !isAdmin) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, userId };
}
