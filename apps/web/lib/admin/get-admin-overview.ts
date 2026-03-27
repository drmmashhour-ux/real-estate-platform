import { prisma } from "@/lib/db";
import type { DisputeStatus } from "@prisma/client";
import { ListingStatus } from "@prisma/client";

export type AdminOverviewStats = {
  totalUsers: number;
  totalBookings: number;
  revenueCents: number;
  commissionCents: number;
  /** CRM + FSBO + short-term (all rows). */
  totalListings: number;
  /** Best-effort “live” visibility: published / approved / non-draft where applicable. */
  activeListings: number;
  totalDeals: number;
  /** Control center — today (local server day). */
  bookingsToday: number;
  revenueTodayCents: number;
  /** Paid platform checkouts — last 7 / 30 days (rolling from server “now”). */
  revenueWeekCents: number;
  revenueMonthCents: number;
  /** BNHub-style bookings not terminal (guest flow still active). */
  activeBookingsCount: number;
  /** BNHub booking disputes still active + platform legal disputes open. */
  openDisputesCount: number;
  /** BNHub host payouts not yet released (completed guest payment, no host release). */
  pendingPayoutsCount: number;
};

const CLOSED_DISPUTE_STATUSES: DisputeStatus[] = [
  "RESOLVED",
  "REJECTED",
  "CLOSED",
  "RESOLVED_PARTIAL_REFUND",
  "RESOLVED_FULL_REFUND",
  "RESOLVED_RELOCATION",
];

export async function getAdminOverviewStats(): Promise<AdminOverviewStats | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      totalUsers,
      totalBookings,
      paid,
      crmTotal,
      fsboTotal,
      stTotal,
      crmActive,
      fsboActive,
      stActive,
      totalDeals,
      bookingsToday,
      revenueTodayPlatform,
      openBnhubDisputes,
      openPlatformLegalDisputes,
      pendingHostPayouts,
      revenueWeek,
      revenueMonth,
      activeBookingsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amountCents: true, platformFeeCents: true },
      }),
      prisma.listing.count(),
      prisma.fsboListing.count(),
      prisma.shortTermListing.count(),
      prisma.listing.count({
        where: { brokerAccesses: { some: {} } },
      }),
      prisma.fsboListing.count({ where: { NOT: { status: "DRAFT" } } }),
      prisma.shortTermListing.count({
        where: { listingStatus: ListingStatus.PUBLISHED },
      }),
      prisma.deal.count(),
      prisma.booking.count({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.platformPayment.aggregate({
        where: {
          status: "paid",
          createdAt: { gte: startOfToday, lt: endOfToday },
        },
        _sum: { amountCents: true },
      }),
      prisma.dispute.count({
        where: { status: { notIn: CLOSED_DISPUTE_STATUSES } },
      }),
      prisma.platformLegalDispute
        .count({
          where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        })
        .catch(() => 0),
      prisma.payment.count({
        where: {
          status: "COMPLETED",
          hostPayoutReleasedAt: null,
        },
      }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: { gte: weekAgo } },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: { gte: monthAgo } },
        _sum: { amountCents: true },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ["PENDING", "AWAITING_HOST_APPROVAL", "CONFIRMED"],
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalBookings,
      revenueCents: paid._sum.amountCents ?? 0,
      commissionCents: paid._sum.platformFeeCents ?? 0,
      totalListings: crmTotal + fsboTotal + stTotal,
      activeListings: crmActive + fsboActive + stActive,
      totalDeals,
      bookingsToday,
      revenueTodayCents: revenueTodayPlatform._sum.amountCents ?? 0,
      revenueWeekCents: revenueWeek._sum.amountCents ?? 0,
      revenueMonthCents: revenueMonth._sum.amountCents ?? 0,
      activeBookingsCount,
      openDisputesCount: openBnhubDisputes + openPlatformLegalDisputes,
      pendingPayoutsCount: pendingHostPayouts,
    };
  } catch {
    return null;
  }
}
