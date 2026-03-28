import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { updatePropertyRating, updateHostPerformance } from "@/src/modules/reviews/aggregationService";
import { scheduleFraudRecheck } from "@/src/workers/fraudDetectionWorker";

const MAX_REVIEWS_PER_USER_PER_DAY = 20;

export type CreateBnhubReviewInput = {
  propertyRating: number;
  hostRating?: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
  comment?: string;
};

function assertRating(name: string, v: number | undefined, required: boolean) {
  if (v == null) {
    if (required) throw new Error(`${name} is required`);
    return;
  }
  if (!Number.isFinite(v) || v < 1 || v > 5) {
    throw new Error(`${name} must be between 1 and 5`);
  }
}

function isBookingPaymentVerified(booking: {
  payment: { status: string } | null;
  bnhubReservationPayment: { paymentStatus: string } | null;
}): boolean {
  if (booking.payment?.status === "COMPLETED") return true;
  const st = booking.bnhubReservationPayment?.paymentStatus;
  return st === "PAID" || st === "PARTIALLY_REFUNDED" || st === "AUTHORIZED";
}

/** Simple heuristics: URL stuffing, repetition, very short generic praise. */
export function computeReviewSpamScore(comment: string | undefined): number {
  if (!comment || !comment.trim()) return 0;
  const t = comment.trim();
  const lower = t.toLowerCase();
  let score = 0;
  const urlMatches = t.match(/https?:\/\/|www\./g);
  if (urlMatches && urlMatches.length >= 2) score += 0.5;
  if (urlMatches && urlMatches.length >= 1) score += 0.15;
  if (t.length < 8 && /^(great|good|ok|nice|bad|terrible|love|hate)\.?$/i.test(t)) score += 0.35;
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const uniq = new Set(words);
    if (uniq.size <= 2) score += 0.4;
  }
  return Math.min(1, score);
}

export async function createReview(
  bookingId: string,
  userId: string,
  listingId: string,
  data: CreateBnhubReviewInput
) {
  assertRating("propertyRating", data.propertyRating, true);
  assertRating("hostRating", data.hostRating, false);
  assertRating("cleanlinessRating", data.cleanlinessRating, false);
  assertRating("accuracyRating", data.accuracyRating, false);
  assertRating("communicationRating", data.communicationRating, false);
  assertRating("locationRating", data.locationRating, false);
  assertRating("valueRating", data.valueRating, false);
  assertRating("checkinRating", data.checkinRating, false);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!user) throw new Error("User not found");
  if (!user.emailVerifiedAt) throw new Error("Verify your email before leaving a review");
  const idv = await prisma.identityVerification.findUnique({
    where: { userId },
    select: { verificationStatus: true },
  });
  if (!idv || idv.verificationStatus !== "VERIFIED") {
    throw new Error("Complete identity verification before leaving a review");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.review.count({
    where: { guestId: userId, createdAt: { gte: since } },
  });
  if (recentCount >= MAX_REVIEWS_PER_USER_PER_DAY) {
    throw new Error("Review limit reached for today; try again tomorrow");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: { select: { status: true } },
      bnhubReservationPayment: { select: { paymentStatus: true } },
      listing: { select: { id: true, ownerId: true } },
    },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.guestId !== userId) throw new Error("Not your booking");
  if (booking.listing.id !== listingId) throw new Error("Listing does not match this booking");
  if (booking.status !== "COMPLETED") throw new Error("Can only review completed stays");
  if (!isBookingPaymentVerified(booking)) throw new Error("Only verified paid stays can be reviewed");

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new Error("Already reviewed");

  const trimmed = data.comment?.trim() ?? "";
  if (trimmed.length > 8000) throw new Error("Comment is too long");

  if (trimmed.length > 0) {
    const dup = await prisma.review.findFirst({
      where: {
        guestId: userId,
        comment: trimmed,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (dup) throw new Error("Duplicate review text recently submitted");
  }

  const spamScore = computeReviewSpamScore(trimmed || undefined);
  const moderationHeld = spamScore >= 0.75;

  const review = await prisma.review.create({
    data: {
      bookingId,
      guestId: userId,
      listingId: booking.listing.id,
      propertyRating: data.propertyRating,
      hostRating: data.hostRating ?? undefined,
      cleanlinessRating: data.cleanlinessRating ?? undefined,
      accuracyRating: data.accuracyRating ?? undefined,
      communicationRating: data.communicationRating ?? undefined,
      locationRating: data.locationRating ?? undefined,
      valueRating: data.valueRating ?? undefined,
      checkinRating: data.checkinRating ?? undefined,
      comment: trimmed || undefined,
      spamScore,
      moderationHeld,
      createdAt: new Date(),
    },
  });

  await updatePropertyRating(booking.listing.id);
  await updateHostPerformance(booking.listing.ownerId);

  scheduleFraudRecheck("review", review.id);

  return review;
}

export async function getPublicListingReviews(
  listingId: string,
  opts?: { limit?: number; cursor?: string }
) {
  const limit = Math.min(Math.max(opts?.limit ?? 12, 1), 50);
  const where: Prisma.ReviewWhereInput = {
    listingId,
    moderationHeld: false,
  };

  const reviews = await prisma.review.findMany({
    where,
    take: limit + 1,
    ...(opts?.cursor
      ? { skip: 1, cursor: { id: opts.cursor } }
      : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      propertyRating: true,
      cleanlinessRating: true,
      accuracyRating: true,
      communicationRating: true,
      locationRating: true,
      valueRating: true,
      checkinRating: true,
      comment: true,
      createdAt: true,
      guest: { select: { name: true } },
    },
  });

  const hasMore = reviews.length > limit;
  const page = hasMore ? reviews.slice(0, limit) : reviews;
  const nextCursor = hasMore ? page[page.length - 1]?.id : undefined;

  return { reviews: page, nextCursor };
}

export async function getListingRatingSummary(listingId: string) {
  const agg =
    (await prisma.propertyRatingAggregate.findUnique({ where: { listingId } })) ??
    (await updatePropertyRating(listingId));

  return agg;
}
