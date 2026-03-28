import { BookingStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export async function handlePublicBookingsGET(searchParams: URLSearchParams) {
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 7) || 7, 1), 90);
  const since = subDays(new Date(), days);

  const [confirmed, pending, cancelled, totalRevenueCents] = await Promise.all([
    prisma.booking.count({
      where: { status: BookingStatus.CONFIRMED, createdAt: { gte: since } },
    }),
    prisma.booking.count({
      where: { status: BookingStatus.PENDING, createdAt: { gte: since } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: since },
        status: {
          in: [
            BookingStatus.CANCELLED,
            BookingStatus.CANCELLED_BY_GUEST,
            BookingStatus.CANCELLED_BY_HOST,
          ],
        },
      },
    }),
    prisma.booking.aggregate({
      where: {
        status: BookingStatus.CONFIRMED,
        createdAt: { gte: since },
      },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    windowDays: days,
    summary: {
      confirmedBookings: confirmed,
      pendingBookings: pending,
      cancelledBookings: cancelled,
      confirmedGrossCents: totalRevenueCents._sum.totalCents ?? 0,
    },
  };
}
