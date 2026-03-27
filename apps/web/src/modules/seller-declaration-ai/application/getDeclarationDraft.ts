import { prisma } from "@/lib/db";
import { getOrCreateDeclarationDraft } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";

export async function getDeclarationDraft(listingId: string, userId: string, isAdmin: boolean) {
  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId }, select: { id: true, ownerId: true } });
  if (!listing) throw new Error("Listing not found");
  if (!isAdmin && listing.ownerId !== userId) throw new Error("Forbidden");
  return getOrCreateDeclarationDraft({ listingId, sellerUserId: listing.ownerId, adminUserId: isAdmin ? userId : null });
}
