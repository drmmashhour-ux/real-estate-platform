import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

/** Admin: any stay. Host (or any signed-in user): only rows they own. */
export async function canManageStayListing(userId: string, listingOwnerId: string): Promise<boolean> {
  if (await isPlatformAdmin(userId)) return true;
  return userId === listingOwnerId;
}

export async function loadStayListingForEditor(listingId: string, userId: string) {
  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      listingPhotos: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      owner: { select: { id: true, email: true, name: true } },
    },
  });
  if (!row) return { row: null as null, forbidden: false };
  const ok = await canManageStayListing(userId, row.ownerId);
  if (!ok) return { row: null as null, forbidden: true };
  return { row, forbidden: false };
}
