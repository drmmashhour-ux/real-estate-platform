import { prisma } from "@/lib/db";
import { effectiveListingSafety } from "@/lib/mobile/safetyPublic";

export const dynamic = "force-dynamic";

/** Guest-safe listing safety surface (no internal notes / evidence). */
export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, listingStatus: true },
  });
  if (!listing || listing.listingStatus !== "PUBLISHED") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const profile = await prisma.bnhubListingSafetyProfile.findUnique({
    where: { listingId },
  });
  const eff = effectiveListingSafety(profile);
  return Response.json({
    listingId,
    reviewStatus: eff.reviewStatus,
    guestMessage: eff.guestMessage,
    bookingAllowed: eff.bookingAllowed,
    listingVisible: eff.listingVisible,
  });
}
