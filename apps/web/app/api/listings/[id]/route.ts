import { authPrisma } from "@/lib/db";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { requireAuth } from "@/lib/auth/middleware";
import { computeListingDealScoreV1 } from "@/lib/ai/dealScore";
import { enhanceListing } from "@/lib/ai/listingEnhancer";
import { isDemoDataActive, isDemoListingId, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoListingById } from "@/lib/demo/data";

/** Public read for marketplace `listings` rows (same source as `GET /api/listings`). */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (isDemoDataActive(req) && isDemoListingId(id)) {
    const demo = getDemoListingById(id, parseDemoScenarioFromRequest(req));
    if (demo) {
      return Response.json(demo);
    }
  }

  const db = getListingsDB();
  console.log("[LISTINGS DB] getListingsDB()");
  const listing = await db.listing.findUnique({
    where: { id },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const host = listing.userId
    ? await authPrisma.user.findUnique({ where: { id: listing.userId } })
    : null;
  const confirmedBookingCount = await db.booking.count({
    where: { listingId: id, status: "confirmed" },
  });
  const dealHighlightScore = computeListingDealScoreV1({
    price: listing.price,
    confirmedBookingCount,
  });
  /** Same-city peer average (excluding this listing) — V1 benchmark for `listingEnhancer`. */
  const peerAvg = await db.listing.aggregate({
    where: { city: listing.city, id: { not: id } },
    _avg: { price: true },
    _count: { _all: true },
  });
  const marketPrice =
    (peerAvg._count._all ?? 0) > 0 && peerAvg._avg.price != null
      ? Number(peerAvg._avg.price)
      : null;
  const enriched = enhanceListing({
    ...listing,
    marketPrice,
  });
  return Response.json({
    ...enriched,
    host,
    dealHighlightScore,
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getListingsDB();

  const listing = await db.listing.findUnique({
    where: { id },
  });

  if (!listing || listing.userId !== user.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.listing.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
