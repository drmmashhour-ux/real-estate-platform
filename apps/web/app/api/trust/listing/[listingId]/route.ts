import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicBadgesForListing } from "@/lib/trust/get-public-badges";

export const dynamic = "force-dynamic";

/**
 * GET /api/trust/listing/[listingId] — listing + host trust badges for BNHub listing id.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  if (!listingId?.trim()) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pack = await getPublicBadgesForListing(listing.id, listing.ownerId);
  return NextResponse.json({
    listingId: listing.id,
    ownerId: listing.ownerId,
    ...pack,
  });
}
