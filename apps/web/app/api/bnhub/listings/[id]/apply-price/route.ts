import { NextRequest, NextResponse } from "next/server";
import { updateListing } from "@/lib/bnhub/listings";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** PATCH /api/bnhub/listings/[id]/apply-price – set listing night price to AI recommended value. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const recommendedCents = typeof body.recommendedCents === "number" ? body.recommendedCents : null;

    if (recommendedCents == null || recommendedCents < 0) {
      return NextResponse.json(
        { error: "Missing or invalid recommendedCents" },
        { status: 400 }
      );
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await updateListing(id, { nightPriceCents: recommendedCents });
    const updated = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { id: true, nightPriceCents: true },
    });
    return NextResponse.json({
      success: true,
      listingId: id,
      nightPriceCents: updated?.nightPriceCents ?? recommendedCents,
    });
  } catch (e) {
    console.error("PATCH /api/bnhub/listings/[id]/apply-price:", e);
    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    );
  }
}
