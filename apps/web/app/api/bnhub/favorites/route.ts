import { NextRequest } from "next/server";
import { SearchEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";

export const dynamic = "force-dynamic";

/** Web session — list BNHub saved stays (Prisma listing ids). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const favs = await prisma.bnhubGuestFavorite.findMany({
    where: { guestUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { listingId: true },
  });
  return Response.json({ listingIds: favs.map((f) => f.listingId) });
}

/** Save or unsave a published stay listing. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { listingId?: string; favorited?: boolean };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, listingStatus: true },
  });
  if (!listing || listing.listingStatus !== "PUBLISHED") {
    return Response.json({ error: "Listing not available" }, { status: 404 });
  }

  if (body.favorited === false) {
    await prisma.bnhubGuestFavorite.deleteMany({
      where: { guestUserId: userId, listingId },
    });
    return Response.json({ ok: true, favorited: false });
  }

  await prisma.bnhubGuestFavorite.upsert({
    where: { guestUserId_listingId: { guestUserId: userId, listingId } },
    create: { guestUserId: userId, listingId },
    update: {},
  });
  void trackSearchEvent({ eventType: SearchEventType.SAVE, userId, listingId });
  return Response.json({ ok: true, favorited: true });
}
