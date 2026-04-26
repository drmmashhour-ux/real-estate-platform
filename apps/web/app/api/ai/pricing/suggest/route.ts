import { ListingAnalyticsKind, ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { calculateDemandScore } from "@/lib/ai/pricing/calculateDemandScore";
import { suggestNightlyPrice } from "@/lib/ai/pricing/suggestNightlyPrice";
import { getOrCreateHostAutopilotSettings } from "@/lib/host/autopilot-settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { bnhubHostListingPromotions: { where: { active: true }, take: 1 } },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return Response.json({ error: "Listing must be published" }, { status: 400 });
  }

  const settings = await getOrCreateHostAutopilotSettings(userId);
  const analytics = await prisma.listingAnalytics.findFirst({
    where: { listingId, kind: ListingAnalyticsKind.BNHUB },
  });
  const views30 = analytics?.viewsTotal ?? 0;
  const views7 = Math.max(analytics?.views24hCached ?? 0, Math.round(views30 * 0.2));
  const bookings30 = await prisma.booking.count({
    where: {
      listingId,
      createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
  });
  const bookingVelocity = Math.min(5, bookings30 / 10);
  const occNights = (
    await prisma.booking.findMany({
      where: {
        listingId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        checkOut: { gte: new Date() },
      },
      select: { nights: true },
    })
  ).reduce((s, r) => s + r.nights, 0);
  const occupancyRate = Math.min(1, occNights / 30);

  const competitionCount = await prisma.shortTermListing.count({
    where: { city: listing.city, listingStatus: ListingStatus.PUBLISHED, id: { not: listing.id } },
  });

  const demand = calculateDemandScore({
    views7d: views7,
    views30d: views30,
    bookingVelocity,
    occupancyRate,
    seasonalityMultiplier: 1,
    hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
    upcomingWeekendBoost: 0.08,
    competitionCount,
  });

  const currentNightly = listing.nightPriceCents / 100;
  const price = suggestNightlyPrice({
    currentNightly,
    hostSettings: settings,
    demand,
    occupancyRate,
    bookingVelocity,
  });

  return Response.json({
    listingId,
    currentPrice: price.currentPrice,
    suggestedPrice: price.suggestedPrice,
    deltaPct: price.deltaPct,
    confidenceScore: price.confidenceScore,
    reasonSummary: price.reasonSummary,
    demandScore: demand.demandScore,
    competitionScore: demand.competitionScore,
    seasonalityScore: demand.seasonalityScore,
  });
}
