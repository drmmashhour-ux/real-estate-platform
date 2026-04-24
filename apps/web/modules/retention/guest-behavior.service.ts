/**
 * Aggregates existing BNHub signals — no new tracking pipeline required.
 */
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GuestBehaviorProfile } from "./types";

const MS_DAY = 86_400_000;

function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));
  if (!valid.length) return null;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

export async function buildGuestBehaviorProfile(userId: string): Promise<GuestBehaviorProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, createdAt: true },
  });
  if (!user) return null;

  const since = new Date(Date.now() - 30 * MS_DAY);

  const [
    searchAgg,
    clientSearchCount,
    behaviorCount,
    distinctViews,
    savesCount,
    completedBookings,
    bookingRows,
    lastSearch,
    lastBehavior,
    lastFavorite,
  ] = await Promise.all([
    prisma.searchEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.bnhubClientSearchEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.userBehaviorEvent.count({
      where: {
        userId,
        createdAt: { gte: since },
        eventType: {
          in: [
            "LISTING_CLICK",
            "LISTING_IMPRESSION",
            "SIMILAR_LISTING_CLICK",
            "SEARCH_FILTERS_APPLIED",
            "LISTING_BOOKING_ATTEMPT",
          ],
        },
      },
    }),
    prisma.userBehaviorEvent
      .groupBy({
        by: ["listingId"],
        where: { userId, createdAt: { gte: since }, listingId: { not: null } },
        _count: { listingId: true },
      })
      .then((r) => r.length),
    prisma.bnhubGuestFavorite.count({ where: { guestUserId: userId } }),
    prisma.booking.count({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.booking.findMany({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      orderBy: { checkIn: "desc" },
      take: 20,
      select: {
        checkOut: true,
        listing: { select: { city: true } },
      },
    }),
    prisma.searchEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.userBehaviorEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.bnhubGuestFavorite.findFirst({
      where: { guestUserId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const bookingCities = [...new Set(bookingRows.map((b) => b.listing.city).filter(Boolean))];
  const lastBookingCheckOut = bookingRows[0]?.checkOut ?? null;

  const lastActivityAt = maxDate(
    lastSearch?.createdAt,
    lastBehavior?.createdAt,
    lastFavorite?.createdAt,
    lastBookingCheckOut
  );

  return {
    userId,
    accountCreatedAt: user.createdAt,
    searchEvents30d: searchAgg,
    clientSearchEvents30d: clientSearchCount,
    behaviorEngagement30d: behaviorCount,
    distinctListingViews30d: distinctViews,
    savesTotal: savesCount,
    completedBookings,
    lastBookingCheckOut,
    lastActivityAt,
    bookingCities,
  };
}
