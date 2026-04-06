import { DisputeStatus, ListingVerificationStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_DISPUTE: DisputeStatus[] = [
  "OPEN",
  "SUBMITTED",
  "UNDER_REVIEW",
  "WAITING_FOR_HOST_RESPONSE",
  "EVIDENCE_REVIEW",
  "ESCALATED",
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Recompute guest-facing trust metrics from completed stays, host reviews, and open disputes/issues.
 */
export async function recomputeGuestTrustMetrics(guestId: string): Promise<void> {
  const completedStays = await prisma.booking.count({
    where: {
      guestId,
      status: "COMPLETED",
      payment: { status: PaymentStatus.COMPLETED },
    },
  });

  const hostReviews = await prisma.bnhubHostReviewOfGuest.findMany({
    where: { guestId },
    select: { guestRespectRating: true },
  });
  const avgHostRating =
    hostReviews.length > 0 ? mean(hostReviews.map((r) => r.guestRespectRating)) : null;

  const bookingIds = (
    await prisma.booking.findMany({
      where: { guestId },
      select: { id: true },
    })
  ).map((b) => b.id);

  let openHeavyDisputes = 0;
  if (bookingIds.length > 0) {
    openHeavyDisputes = await prisma.dispute.count({
      where: {
        bookingId: { in: bookingIds },
        status: { in: OPEN_DISPUTE },
      },
    });
  }

  const openSimple =
    bookingIds.length === 0
      ? 0
      : await prisma.bnhubTrustSimpleDispute.count({
          where: {
            bookingId: { in: bookingIds },
            status: "OPEN",
          },
        });

  const openIssues =
    bookingIds.length === 0
      ? 0
      : await prisma.bookingIssue.count({
          where: {
            bookingId: { in: bookingIds },
            status: "open",
          },
        });

  let score = 50;
  score += Math.min(25, completedStays * 2);
  if (avgHostRating != null) {
    score += (avgHostRating - 3) * 8;
  }
  score -= openHeavyDisputes * 12;
  score -= openSimple * 10;
  score -= openIssues * 8;

  await prisma.user.update({
    where: { id: guestId },
    data: {
      bnhubGuestTrustScore: Math.round(clamp(score, 0, 100)),
      bnhubGuestTotalStays: completedStays,
      bnhubGuestRatingAverage: avgHostRating,
    },
  });
}

/**
 * Sync denormalized listing trust fields from reviews aggregate + booking counts + verification flags.
 */
export async function syncListingBnhubTrustSnapshot(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      listingVerificationStatus: true,
    },
  });
  if (!listing) return;

  const agg = await prisma.propertyRatingAggregate.findUnique({
    where: { listingId },
  });

  const completedStays = await prisma.booking.count({
    where: {
      listingId,
      status: "COMPLETED",
      payment: { status: PaymentStatus.COMPLETED },
    },
  });

  const avg = agg && agg.totalReviews > 0 ? agg.avgRating : null;
  const reviewCount = agg?.totalReviews ?? 0;

  const hostVerified = listing.listingVerificationStatus === ListingVerificationStatus.VERIFIED;
  const topHost =
    completedStays >= 10 && avg != null && avg >= 4.5 && hostVerified;

  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: {
      bnhubListingRatingAverage: avg,
      bnhubListingReviewCount: reviewCount,
      bnhubListingCompletedStays: completedStays,
      bnhubListingHostVerified: hostVerified,
      bnhubListingTopHostBadge: topHost,
    },
  });
}

export type ListingTrustSnapshot = {
  ratingAverage: number | null;
  reviewCount: number;
  completedStays: number;
  hostVerified: boolean;
  topHost: boolean;
};

export async function getListingTrustSnapshot(listingId: string): Promise<ListingTrustSnapshot | null> {
  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      bnhubListingCompletedStays: true,
      bnhubListingHostVerified: true,
      bnhubListingTopHostBadge: true,
    },
  });
  if (!row) return null;
  return {
    ratingAverage: row.bnhubListingRatingAverage,
    reviewCount: row.bnhubListingReviewCount,
    completedStays: row.bnhubListingCompletedStays,
    hostVerified: row.bnhubListingHostVerified,
    topHost: row.bnhubListingTopHostBadge,
  };
}

/** Merge Prisma trust snapshot onto browse rows (single query). */
export async function mergeTrustSnapshotsOntoListingIds<T extends { id: string }>(
  rows: T[]
): Promise<(T & ListingTrustSnapshot)[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.id))];
  const found = await prisma.shortTermListing.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      bnhubListingCompletedStays: true,
      bnhubListingHostVerified: true,
      bnhubListingTopHostBadge: true,
    },
  });
  const byId = new Map(
    found.map((r) => [
      r.id,
      {
        ratingAverage: r.bnhubListingRatingAverage,
        reviewCount: r.bnhubListingReviewCount,
        completedStays: r.bnhubListingCompletedStays,
        hostVerified: r.bnhubListingHostVerified,
        topHost: r.bnhubListingTopHostBadge,
      } satisfies ListingTrustSnapshot,
    ])
  );
  return rows.map((row) => {
    const snap = byId.get(row.id);
    return {
      ...row,
      ratingAverage: snap?.ratingAverage ?? null,
      reviewCount: snap?.reviewCount ?? 0,
      completedStays: snap?.completedStays ?? 0,
      hostVerified: snap?.hostVerified ?? false,
      topHost: snap?.topHost ?? false,
    };
  });
}

export async function applyPayoutHoldForTrustDispute(bookingId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { bookingId },
    data: {
      payoutHoldReason: "dispute",
    },
  });
}
