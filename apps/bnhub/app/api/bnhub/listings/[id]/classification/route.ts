import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { ListingStatus } from "@prisma/client";
import { recomputePropertyClassificationForListing } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

/** GET — BNHUB classification for a listing (public when published; host/admin for drafts). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true, listingStatus: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userId = await getGuestId();
    const admin = userId ? await isPlatformAdmin(userId) : false;
    const isOwner = Boolean(userId && listing.ownerId === userId);
    const isPublished = listing.listingStatus === ListingStatus.PUBLISHED;
    if (!isPublished && !isOwner && !admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let row = await prisma.bnhubPropertyClassification.findUnique({ where: { listingId: id } });
    const refreshRequested = request.nextUrl.searchParams.get("refresh") === "1";
    const mayRefresh = isOwner || admin;
    if (!row || (refreshRequested && mayRefresh)) {
      await recomputePropertyClassificationForListing(id);
      row = await prisma.bnhubPropertyClassification.findUnique({ where: { listingId: id } });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load classification" }, { status: 500 });
  }
}
