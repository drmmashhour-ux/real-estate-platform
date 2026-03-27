import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";

export async function assertFsboListingAccessibleForPhase3(listingId: string, userId: string | null) {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, status: true, moderationStatus: true },
  });
  if (!listing) return { ok: false as const, status: 404 as const };
  const isOwner = Boolean(userId && listing.ownerId === userId);
  const isAdmin = await isPlatformAdmin(userId);
  const publicOk = isFsboPubliclyVisible(listing);
  if (!isOwner && !isAdmin && !publicOk) {
    return { ok: false as const, status: 404 as const };
  }
  return { ok: true as const, isOwner, isAdmin };
}
