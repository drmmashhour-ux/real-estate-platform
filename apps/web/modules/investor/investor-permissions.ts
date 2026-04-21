import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { userCanManageListingListing } from "@/modules/esg/esg.service";

/**
 * Memo / IC pack access: CRM listing owner or broker with listing access, admin,
 * or INVESTOR role **when** they are also the listing owner (same-account investor).
 * Public API never exposes payloads without this check.
 */
export async function userCanAccessInvestorDocuments(userId: string, listingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === PlatformRole.ADMIN) return true;
  if (await userCanManageListingListing(userId, listingId)) return true;

  if (user.role === PlatformRole.INVESTOR) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    return listing?.ownerId === userId;
  }

  return false;
}
