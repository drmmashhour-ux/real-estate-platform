import { prisma } from "@/lib/db";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export type PlatformKpiSnapshot = {
  totalListings: number;
  activeFsboListings: number;
  bookingsConfirmed: number;
  gmvCents: number;
  platformRevenueCentsApprox: number;
  conversionRateApprox: number | null;
  avgBookingValueCents: number | null;
};

export async function computePlatformKpis(since: Date): Promise<PlatformKpiSnapshot> {
  const [totalListings, activeFsbo, bookings, payAgg, payCount] = await Promise.all([
    prisma.fsboListing.count(),
    prisma.fsboListing.count({ where: { status: "ACTIVE", moderationStatus: "APPROVED" } }),
    prisma.booking.count({
      where: { status: BookingStatus.CONFIRMED, createdAt: { gte: since } },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, createdAt: { gte: since } },
      _sum: { amountCents: true, platformFeeCents: true },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.COMPLETED, createdAt: { gte: since } },
    }),
  ]);

  const gmvCents = payAgg._sum.amountCents ?? 0;
  const platformRevenueCentsApprox = payAgg._sum.platformFeeCents ?? 0;
  const avgBookingValueCents =
    payCount > 0 ? Math.round(gmvCents / payCount) : null;

  return {
    totalListings,
    activeFsboListings: activeFsbo,
    bookingsConfirmed: bookings,
    gmvCents,
    platformRevenueCentsApprox,
    conversionRateApprox: null,
    avgBookingValueCents,
  };
}
