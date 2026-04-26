import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { fetchPublicListingCardsByIds } from "@/lib/mobile/listingMobileDto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const favs = await prisma.bnhubGuestFavorite.findMany({
      where: { guestUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const listings = await fetchPublicListingCardsByIds(favs.map((f) => f.listingId));
    return Response.json({ listings });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = (await request.json().catch(() => ({}))) as { listingId?: string; favorited?: boolean };
    if (!body.listingId) return Response.json({ error: "listingId required" }, { status: 400 });
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: body.listingId },
      select: { id: true, listingStatus: true },
    });
    if (!listing || listing.listingStatus !== "PUBLISHED") {
      return Response.json({ error: "Listing not available" }, { status: 404 });
    }
    if (body.favorited === false) {
      await prisma.bnhubGuestFavorite.deleteMany({
        where: { guestUserId: user.id, listingId: body.listingId },
      });
      return Response.json({ ok: true, favorited: false });
    }
    await prisma.bnhubGuestFavorite.upsert({
      where: {
        guestUserId_listingId: { guestUserId: user.id, listingId: body.listingId },
      },
      create: { guestUserId: user.id, listingId: body.listingId },
      update: {},
    });
    return Response.json({ ok: true, favorited: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
