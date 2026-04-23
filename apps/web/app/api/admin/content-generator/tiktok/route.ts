import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { generateTikTokScripts, toTikTokListingInput } from "@/lib/bnhub/tiktok-scripts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json().catch(() => ({}))) as { listingId?: unknown };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const payload = await generateTikTokScripts(toTikTokListingInput(listing));

  return NextResponse.json({
    ok: true,
    listing: {
      id: listing.id,
      listingCode: listing.listingCode,
      title: listing.title,
      city: listing.city,
    },
    ...payload,
  });
}
