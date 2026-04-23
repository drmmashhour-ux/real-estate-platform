import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

/**
 * Negotiation drafts are sensitive — owner, admin, or party on the linked declaration only.
 */
export async function assertNegotiationDraftAccess(args: { listingId: string; documentId?: string | null }): Promise<
  { ok: true; userId: string } | { ok: false; status: number; message: string }
> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, status: 401, message: "Unauthorized" };

  if (args.documentId) {
    const allowed = await assertDocumentAccess(args.documentId, userId);
    if (!allowed) return { ok: false, status: 403, message: "Forbidden" };
    const doc = await prisma.sellerDeclarationDraft.findFirst({
      where: { id: args.documentId },
      select: { listingId: true },
    });
    if (!doc || doc.listingId !== args.listingId) return { ok: false, status: 400, message: "Listing mismatch" };
    return { ok: true, userId };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    select: { ownerId: true },
  });
  if (!listing) return { ok: false, status: 404, message: "Not found" };
  const admin = await isPlatformAdmin(userId);
  if (listing.ownerId !== userId && !admin) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return { ok: true, userId };
}
