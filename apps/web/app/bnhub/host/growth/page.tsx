import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingStatus, ListingStatus } from "@prisma/client";
import { BnhubHostGrowthClient } from "@/components/bnhub/host/BnhubHostGrowthClient";
import { getGuestId } from "@/lib/auth/session";
import {
  aggregateMonthlyBookingMetrics,
  averageOccupancyHighPercent,
  buildGrowthAlerts,
  buildGrowthInsightsForListing,
  computeHostGrowthLevel,
  estimatePortfolioOccupancyPercent,
  medianPeerNightPriceCents,
  pickPerformanceRow,
  revenueTrendDirection,
  type CompetitorSnapshot,
  type HostGrowthListingInput,
} from "@/lib/bnhub/host-growth-engine";
import { prisma } from "@/lib/db";
import { buildHostPerformanceSummary } from "@/modules/bnhub/host-performance/host-performance.service";

export const metadata: Metadata = {
  title: "BNHub — Host growth",
  description: "Occupancy, revenue trends, growth insights, and retention tools for BNHub hosts.",
};

export default async function BnhubHostGrowthPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/bnhub/host/growth");
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      description: true,
      photos: true,
      amenities: true,
      updatedAt: true,
      listingStatus: true,
      bnhubListingCompletedStays: true,
      bnhubListingReviewCount: true,
      bnhubListingRatingAverage: true,
    },
  });

  const published = listings.filter((l) => l.listingStatus === ListingStatus.PUBLISHED);
  const growthInputs: HostGrowthListingInput[] = published.map((l) => ({
    id: l.id,
    listingCode: l.listingCode ?? l.id.slice(0, 10),
    title: l.title,
    city: l.city,
    nightPriceCents: l.nightPriceCents,
    description: l.description,
    photos: l.photos,
    amenities: l.amenities,
    updatedAt: l.updatedAt,
    bnhubListingCompletedStays: l.bnhubListingCompletedStays,
    bnhubListingReviewCount: l.bnhubListingReviewCount,
    bnhubListingRatingAverage: l.bnhubListingRatingAverage,
  }));

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentBookings = await prisma.booking.findMany({
    where: {
      listing: { ownerId: userId },
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.PENDING,
          BookingStatus.AWAITING_HOST_APPROVAL,
        ],
      },
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
      priceSnapshotTotalCents: true,
      totalCents: true,
    },
  });

  const monthly = aggregateMonthlyBookingMetrics(
    recentBookings.map((r) => ({
      createdAt: r.createdAt,
      priceSnapshotTotalCents: r.priceSnapshotTotalCents,
      totalCents: r.totalCents,
    })),
  );

  const summary = await buildHostPerformanceSummary(userId);

  const totalStays = listings.reduce((s, l) => s + l.bnhubListingCompletedStays, 0);
  const asOfMs = new Date().getTime();
  const publishedDaySpans = published.map((l) =>
    Math.floor((asOfMs - l.updatedAt.getTime()) / 86_400_000),
  );
  const freshestDays = publishedDaySpans.length ? Math.min(...publishedDaySpans) : null;
  const staleDays = publishedDaySpans.length ? Math.max(...publishedDaySpans) : null;

  const hostLevel = computeHostGrowthLevel({
    totalCompletedStays: totalStays,
    strongListingCount: summary.strongListings,
    watchOrWeakListingCount: summary.watchListings + summary.weakListings,
    listingUpdatedWithinDays: freshestDays,
  });

  const primaryCity = published[0]?.city?.trim() || null;
  let competitors: CompetitorSnapshot[] = [];
  if (primaryCity) {
    const raw = await prisma.shortTermListing.findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: primaryCity,
        NOT: { ownerId: userId },
      },
      take: 8,
      orderBy: { nightPriceCents: "asc" },
      select: {
        id: true,
        title: true,
        city: true,
        nightPriceCents: true,
        bnhubListingRatingAverage: true,
        bnhubListingReviewCount: true,
      },
    });
    competitors = raw.map((c) => ({
      listingId: c.id,
      title: c.title,
      city: c.city,
      nightPriceCents: c.nightPriceCents,
      rating: c.bnhubListingRatingAverage,
      reviewCount: c.bnhubListingReviewCount,
    }));
  }

  const peersForMedian = competitors.map((c) => ({ nightPriceCents: c.nightPriceCents }));
  const yourFirst = published[0];
  const marketMedianNightCents = yourFirst
    ? medianPeerNightPriceCents(peersForMedian, yourFirst.nightPriceCents)
    : null;

  const listingInsights = published.map((l) => {
    const perf = pickPerformanceRow(summary, l.id);
    const median = medianPeerNightPriceCents(
      peersForMedian.length ? peersForMedian : [{ nightPriceCents: l.nightPriceCents }],
      l.nightPriceCents,
    );
    const input: HostGrowthListingInput = {
      id: l.id,
      listingCode: l.listingCode ?? l.id.slice(0, 10),
      title: l.title,
      city: l.city,
      nightPriceCents: l.nightPriceCents,
      description: l.description,
      photos: l.photos,
      amenities: l.amenities,
      updatedAt: l.updatedAt,
      bnhubListingCompletedStays: l.bnhubListingCompletedStays,
      bnhubListingReviewCount: l.bnhubListingReviewCount,
      bnhubListingRatingAverage: l.bnhubListingRatingAverage,
    };
    return {
      listingId: l.id,
      title: l.title,
      listingCode: l.listingCode ?? l.id.slice(0, 10),
      insights: buildGrowthInsightsForListing(input, perf, median),
    };
  });

  const occHigh = averageOccupancyHighPercent(growthInputs);
  const lastMo = monthly[monthly.length - 1]?.bookings ?? 0;
  const prevMo = monthly[monthly.length - 2]?.bookings ?? 0;
  const momDelta = lastMo - prevMo;

  const alerts = buildGrowthAlerts({
    avgOccupancyHighPct: occHigh,
    listingsStaleDays: staleDays,
    monthOverMonthBookingsDelta: momDelta,
  });

  const occupancyEstimate = estimatePortfolioOccupancyPercent(growthInputs);
  const trend = revenueTrendDirection(monthly);

  return (
    <BnhubHostGrowthClient
      listingInsights={listingInsights}
      alerts={alerts}
      hostLevel={hostLevel}
      monthly={monthly}
      occupancyEstimatePct={occupancyEstimate}
      revenueTrend={trend}
      competitors={competitors.slice(0, 5)}
      yourNightCents={yourFirst?.nightPriceCents ?? null}
      marketMedianNightCents={marketMedianNightCents}
      monthOverMonthBookingsDelta={momDelta}
      daysSinceListingUpdate={staleDays}
      dashboardHref="/en/ca/dashboard/bnhub/host"
      insightsHref="/en/ca/host/bnhub/insights"
      pricingHref="/en/ca/host/pricing"
    />
  );
}
