import { prisma } from "@/lib/db";
import { BookingStatus, BnhubFraudFlagStatus } from "@prisma/client";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import type { RankingFeatureVector } from "./bnhub-ranking.types";

const CANCELLED: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
];

export async function buildRankingFeatureVector(listingId: string): Promise<RankingFeatureVector | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      verificationStatus: true,
      nightPriceCents: true,
      bnhubListingCompletedStays: true,
      bnhubListingReviewCount: true,
      bnhubListingRatingAverage: true,
      description: true,
      photos: true,
      amenities: true,
      updatedAt: true,
      listingPhotos: { select: { id: true } },
      reviews: { select: { propertyRating: true }, take: 80 },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
      bnhubTrustProfile: { select: { trustScore: true } },
      bnhubFraudFlags: {
        where: { status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW, BnhubFraudFlagStatus.ESCALATED] } },
        select: { id: true },
      },
    },
  });

  if (!listing) return null;

  const bookingAgg = await prisma.booking.groupBy({
    by: ["status"],
    where: { listingId },
    _count: { _all: true },
  });
  let cancelled = 0;
  let total = 0;
  for (const row of bookingAgg) {
    total += row._count._all;
    if (CANCELLED.includes(row.status)) cancelled += row._count._all;
  }

  const reviewAvg =
    listing.bnhubListingRatingAverage != null
      ? listing.bnhubListingRatingAverage
      : listing.reviews.length > 0
        ? listing.reviews.reduce((s, r) => s + r.propertyRating, 0) / listing.reviews.length
        : null;

  const photoCount = Math.max(
    Array.isArray(listing.photos)
      ? listing.photos.filter((x): x is string => typeof x === "string" && x.length > 0).length
      : 0,
    listing.listingPhotos.length,
  );
  const amenityCount = Array.isArray(listing.amenities) ? listing.amenities.length : 0;

  let priceVsPeerRatio: number | null = null;
  try {
    const smart = await generateSmartPrice(listingId);
    if (smart.marketAvgCents && smart.marketAvgCents > 0) {
      priceVsPeerRatio = listing.nightPriceCents / smart.marketAvgCents;
    }
  } catch {
    priceVsPeerRatio = null;
  }

  const recencyDays = Math.max(0, (Date.now() - listing.updatedAt.getTime()) / 86400000);

  return {
    listingId: listing.id,
    verified: listing.verificationStatus === "VERIFIED",
    reviewAverage: reviewAvg,
    reviewCount: listing._count.reviews,
    completedStays: listing.bnhubListingCompletedStays,
    totalBookings: total || listing._count.bookings,
    cancelledBookings: cancelled,
    photoCount,
    amenityCount,
    descriptionChars: (listing.description ?? "").trim().length,
    fraudOpenCount: listing.bnhubFraudFlags.length,
    trustProfileScore: listing.bnhubTrustProfile?.trustScore ?? null,
    recencyDays,
    priceVsPeerRatio,
  };
}
