import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { syncBnhubListingWishlistCount } from "@/lib/bnhub/bnhub-ethical-seeding";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { trackGrowthSystemEvent } from "@/modules/growth/tracking.service";
import { GrowthEventName } from "@/modules/growth/event-types";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  listingId: z.string().uuid(),
  favorited: z.boolean(),
});

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ listingIds: [] as string[], authenticated: false });
  }
  const rows = await prisma.bnhubGuestFavorite.findMany({
    where: { guestUserId: userId },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return Response.json({
    listingIds: rows.map((r) => r.listingId),
    authenticated: true,
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub_favorites:${ip}`, { max: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in to save stays to your list." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "listingId and favorited required" }, { status: 400 });
  }
  const { listingId, favorited } = parsed.data;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, listingStatus: true },
  });
  if (!listing || listing.listingStatus !== ListingStatus.PUBLISHED) {
    return Response.json({ error: "Listing not available" }, { status: 404 });
  }

  if (!favorited) {
    await prisma.bnhubGuestFavorite.deleteMany({
      where: { guestUserId: userId, listingId },
    });
  } else {
    await prisma.bnhubGuestFavorite.upsert({
      where: { guestUserId_listingId: { guestUserId: userId, listingId } },
      create: { guestUserId: userId, listingId },
      update: {},
    });
    void trackGrowthSystemEvent(
      GrowthEventName.CTA_CLICK,
      { ctaId: "bnhub_wishlist_save", listingId, surface: "bnhub_favorites_api" },
      { userId, cookieHeader: req.headers.get("cookie"), pageUrl: req.url, referrerHeader: req.headers.get("referer") }
    ).catch(() => {});
  }

  const wishlistTotal = await syncBnhubListingWishlistCount(listingId);

  return Response.json({ ok: true, favorited, wishlistTotal }, { headers: getRateLimitHeaders(rl) });
}
