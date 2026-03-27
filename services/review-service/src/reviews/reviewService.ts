import { prisma } from "../db.js";
import type { CreateReviewBody, ListReviewsQuery } from "../validation/schemas.js";
import type { Prisma } from "@prisma/client";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Create a review (guest only, after completed booking). */
export async function createReview(data: CreateReviewBody) {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: { listing: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.guestId !== data.guestId) throw new Error("Not your booking");
  if (booking.status !== "COMPLETED") throw new Error("Can only review completed stays");
  if (booking.listingId !== data.listingId) throw new Error("Listing does not match booking");

  const existing = await prisma.review.findUnique({
    where: { bookingId: data.bookingId },
  });
  if (existing) throw new Error("Already reviewed");

  const review = await prisma.review.create({
    data: {
      bookingId: data.bookingId,
      guestId: data.guestId,
      listingId: data.listingId,
      propertyRating: data.propertyRating,
      hostRating: data.hostRating ?? undefined,
      comment: data.comment ?? undefined,
      status: "PENDING",
    },
    include: {
      guest: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return toReviewResponse(review);
}

/** List reviews with filters. Default status APPROVED unless specified. */
export async function listReviews(query: ListReviewsQuery) {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const where: Prisma.ReviewWhereInput = {};
  if (query.listingId) where.listingId = query.listingId;
  if (query.guestId) where.guestId = query.guestId;
  if (query.hostId) where.listing = { ownerId: query.hostId };
  where.status = query.status ?? "APPROVED";

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        guest: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true, ownerId: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: items.map(toReviewResponse),
    pagination: { limit, offset, total },
  };
}

/** Listing ratings: average, count, breakdown (1-5), host rating average. */
export async function getListingRatings(listingId: string) {
  const reviews = await prisma.review.findMany({
    where: { listingId, status: "APPROVED" },
    select: { propertyRating: true, hostRating: true },
  });

  const count = reviews.length;
  if (count === 0) {
    return {
      listingId,
      count: 0,
      averagePropertyRating: null,
      averageHostRating: null,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sumProperty = reviews.reduce((a, r) => a + r.propertyRating, 0);
  const withHost = reviews.filter((r) => r.hostRating != null) as { propertyRating: number; hostRating: number }[];
  const sumHost = withHost.reduce((a, r) => a + r.hostRating, 0);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const r of reviews) {
    breakdown[r.propertyRating as keyof typeof breakdown]++;
  }

  return {
    listingId,
    count,
    averagePropertyRating: round1(sumProperty / count),
    averageHostRating: withHost.length > 0 ? round1(sumHost / withHost.length) : null,
    breakdown,
  };
}

/** User reputation: as host (received host ratings) and as guest (given property ratings). */
export async function getUserRatings(userId: string) {
  const [asHostReviews, asGuestReviews] = await Promise.all([
    prisma.review.findMany({
      where: { listing: { ownerId: userId }, status: "APPROVED" },
      select: { hostRating: true },
    }),
    prisma.review.findMany({
      where: { guestId: userId, status: "APPROVED" },
      select: { propertyRating: true },
    }),
  ]);

  const hostRatings = asHostReviews.filter((r) => r.hostRating != null) as { hostRating: number }[];
  const guestCount = asGuestReviews.length;
  const hostCount = hostRatings.length;

  const hostAvg = hostCount > 0
    ? round1(hostRatings.reduce((a, r) => a + r.hostRating, 0) / hostCount)
    : null;
  const guestAvg = guestCount > 0
    ? round1(asGuestReviews.reduce((a, r) => a + r.propertyRating, 0) / guestCount)
    : null;

  return {
    userId,
    asHost: {
      reviewCount: hostCount,
      averageRating: hostAvg,
      reputationScore: hostAvg != null ? round1(hostAvg * 20) : null,
    },
    asGuest: {
      reviewCount: guestCount,
      averageRating: guestAvg,
      reputationScore: guestAvg != null ? round1(guestAvg * 20) : null,
    },
  };
}

/** Moderate a review (approve or reject). */
export async function moderateReview(
  reviewId: string,
  data: { status: "APPROVED" | "REJECTED"; moderatorId?: string; rejectionReason?: string }
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) return null;

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: data.status,
      moderatedAt: new Date(),
      moderatorId: data.moderatorId ?? undefined,
      rejectionReason: data.status === "REJECTED" ? data.rejectionReason ?? undefined : null,
    },
    include: {
      guest: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return toReviewResponse(updated);
}

function toReviewResponse(review: {
  id: string;
  propertyRating: number;
  hostRating: number | null;
  comment: string | null;
  status: string;
  moderatedAt: Date | null;
  moderatorId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  guestId: string;
  listingId: string;
  bookingId: string;
  guest?: { id: string; name: string | null };
  listing?: { id: string; title: string; ownerId?: string };
}) {
  return {
    id: review.id,
    propertyRating: review.propertyRating,
    hostRating: review.hostRating ?? null,
    comment: review.comment ?? null,
    status: review.status,
    moderatedAt: review.moderatedAt?.toISOString() ?? null,
    moderatorId: review.moderatorId ?? null,
    rejectionReason: review.rejectionReason ?? null,
    createdAt: review.createdAt.toISOString(),
    guestId: review.guestId,
    listingId: review.listingId,
    bookingId: review.bookingId,
    guest: review.guest,
    listing: review.listing,
  };
}
