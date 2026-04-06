import { ListingAnalyticsKind, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOrCreateHostAutopilotSettings } from "@/lib/host/autopilot-settings";
import { calculateDemandScore } from "@/lib/ai/pricing/calculateDemandScore";
import { suggestNightlyPrice } from "@/lib/ai/pricing/suggestNightlyPrice";

export type HostPricingListingRow = {
  listingId: string;
  title: string;
  city: string;
  listingCode: string;
  currentNightly: number;
  suggestedNightly: number;
  deltaPct: number;
  confidence: number;
  reason: string;
  demandScore: number;
};

export type HostPricingOverview = {
  averageCurrentNightly: number;
  averageSuggestedNightly: number;
  occupancyRatePercent: number;
  demandScoreAvg: number;
  listings: HostPricingListingRow[];
  snapshots: { listingId: string; capturedAt: Date; suggestedPrice: number | null; basePrice: number }[];
};

export async function getHostPricingOverview(hostId: string): Promise<HostPricingOverview> {
  const settings = await getOrCreateHostAutopilotSettings(hostId);
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId, listingStatus: ListingStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      city: true,
      listingCode: true,
      nightPriceCents: true,
      bnhubHostListingPromotions: { where: { active: true }, take: 1 },
    },
  });

  const ids = listings.map((l) => l.id);
  const analytics = ids.length
    ? await prisma.listingAnalytics.findMany({
        where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: ids } },
      })
    : [];
  const aMap = new Map(analytics.map((a) => [a.listingId, a]));

  const rows: HostPricingListingRow[] = [];
  let sumCur = 0;
  let sumSug = 0;
  let sumDemand = 0;

  for (const l of listings) {
    const a = aMap.get(l.id);
    const views30 = a?.viewsTotal ?? 0;
    const views7 = Math.max(a?.views24hCached ?? 0, Math.round(views30 * 0.2));
    const bookings30 = await prisma.booking.count({
      where: {
        listingId: l.id,
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
    });
    const bookingVelocity = Math.min(5, bookings30 / 10);
    const occNights = (
      await prisma.booking.findMany({
        where: {
          listingId: l.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          checkOut: { gte: new Date() },
        },
        select: { nights: true },
      })
    ).reduce((s, r) => s + r.nights, 0);
    const occupancyRate = Math.min(1, occNights / 30);

    const competitionCount = await prisma.shortTermListing.count({
      where: { city: l.city, listingStatus: ListingStatus.PUBLISHED, id: { not: l.id } },
    });

    const demand = calculateDemandScore({
      views7d: views7,
      views30d: views30,
      bookingVelocity,
      occupancyRate,
      seasonalityMultiplier: 1,
      hasActivePromotion: l.bnhubHostListingPromotions.length > 0,
      upcomingWeekendBoost: 0.08,
      competitionCount,
    });

    const currentNightly = l.nightPriceCents / 100;
    const price = suggestNightlyPrice({
      currentNightly,
      hostSettings: settings,
      demand,
      occupancyRate,
      bookingVelocity,
    });

    sumCur += currentNightly;
    sumSug += price.suggestedPrice;
    sumDemand += demand.demandScore;

    rows.push({
      listingId: l.id,
      title: l.title,
      city: l.city,
      listingCode: l.listingCode,
      currentNightly,
      suggestedNightly: price.suggestedPrice,
      deltaPct: price.deltaPct,
      confidence: price.confidenceScore,
      reason: price.reasonSummary,
      demandScore: demand.demandScore,
    });
  }

  const n = Math.max(1, rows.length);
  const snapshots = await prisma.listingPricingSnapshot.findMany({
    where: { listingId: { in: ids } },
    orderBy: { capturedAt: "desc" },
    take: 40,
    select: { listingId: true, capturedAt: true, suggestedPrice: true, basePrice: true },
  });

  const occ = await prisma.booking.count({
    where: {
      listing: { ownerId: hostId },
      status: { in: ["CONFIRMED", "COMPLETED"] },
      checkOut: { gte: new Date() },
    },
  });

  return {
    averageCurrentNightly: sumCur / n,
    averageSuggestedNightly: sumSug / n,
    occupancyRatePercent: Math.min(100, Math.round((occ / Math.max(1, ids.length * 2)) * 10)),
    demandScoreAvg: sumDemand / n,
    listings: rows,
    snapshots,
  };
}
