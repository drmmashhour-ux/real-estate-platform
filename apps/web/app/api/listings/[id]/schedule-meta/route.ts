import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Listing owner user id for scheduling (property visits). */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      ownerId: true,
      owner: { select: { id: true, role: true } },
    },
  });
  if (!listing || !listing.ownerId) {
    return NextResponse.json({ error: "Listing not found or has no owner" }, { status: 404 });
  }
  if (listing.owner?.role !== "BROKER") {
    return NextResponse.json({ error: "Listing owner is not a broker" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    listingId: listing.id,
    title: listing.title,
    brokerId: listing.ownerId,
  });
}
