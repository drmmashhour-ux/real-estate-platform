import type { ListingContactTargetKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";

export async function assertListingContactTargetValid(
  targetKind: ListingContactTargetKind,
  targetListingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (targetKind === "FSBO_LISTING") {
    const row = await prisma.fsboListing.findUnique({ where: { id: targetListingId } });
    if (!row || !isFsboPubliclyVisible(row)) {
      return { ok: false, error: "Listing not available" };
    }
    return { ok: true };
  }
  const crm = await prisma.listing.findUnique({ where: { id: targetListingId }, select: { id: true } });
  if (!crm) {
    return { ok: false, error: "Listing not available" };
  }
  return { ok: true };
}
