import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { getGuestId } from "@/lib/auth/session";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { trackEvent } from "@/src/modules/analytics/eventTracker";
import { refreshFsboListingAnalytics } from "@/lib/listings/listing-analytics-service";

export const dynamic = "force-dynamic";

/** GET — saved listing ids for current user */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.buyerSavedListing.findMany({
    where: { userId },
    select: { fsboListingId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ savedIds: rows.map((r) => r.fsboListingId) });
}

/** POST — toggle saved state for a listing */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const fsboListingId = typeof o.fsboListingId === "string" ? o.fsboListingId.trim() : "";
  if (!fsboListingId) return NextResponse.json({ error: "fsboListingId required" }, { status: 400 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: {
      ownerId: true,
      status: true,
      moderationStatus: true,
      city: true,
      propertyType: true,
      priceCents: true,
    },
  });
  if (!listing || !isFsboPubliclyVisible(listing)) {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }

  const existing = await prisma.buyerSavedListing.findUnique({
    where: { userId_fsboListingId: { userId, fsboListingId } },
  });

  if (existing) {
    await prisma.buyerSavedListing.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.buyerSavedListing.create({
    data: { userId, fsboListingId },
  });
  void refreshFsboListingAnalytics(fsboListingId, listing.priceCents).catch(() => {});
  void trackEvent(
    "favorite",
    {
      listingId: fsboListingId,
      city: listing.city ?? undefined,
      propertyType: listing.propertyType ?? undefined,
      priceCents: listing.priceCents ?? undefined,
    },
    { userId }
  ).catch(() => {});
  void persistLaunchEvent("SAVE_PROPERTY", { userId, fsboListingId });
  return NextResponse.json({ saved: true });
}
