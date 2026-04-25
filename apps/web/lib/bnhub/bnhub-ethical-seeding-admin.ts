import { BookingStatus, SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function loadBnhubEthicalSeedingAdminStats() {
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [viewEvents, saves, bookings, lifetimeViewsAgg, wishlistTotal] = await Promise.all([
    prisma.searchEvent.count({
      where: {
        eventType: SearchEventType.VIEW,
        createdAt: { gte: since },
        listingId: { not: null },
      },
    }),
    prisma.bnhubGuestFavorite.count({ where: { createdAt: { gte: since } } }),
    prisma.booking.count({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        createdAt: { gte: since },
      },
    }),
    prisma.shortTermListing.aggregate({ _sum: { bnhubListingViewCount: true } }),
    prisma.bnhubGuestFavorite.count(),
  ]);

  return {
    rangeDays: 30,
    since: since.toISOString(),
    listingDetailViewsSearchEvents: viewEvents,
    newWishlistSaves: saves,
    confirmedOrCompletedBookings: bookings,
    sumLifetimeListingViewCounter: lifetimeViewsAgg._sum.bnhubListingViewCount ?? 0,
    totalWishlistRows: wishlistTotal,
  };
}
