import { prisma } from "@/lib/db";

export type BnhubRevenueDashboardSnapshot = {
  rangeDays: number;
  rangeStart: string;
  rangeEnd: string;
  /** Guest payments captured (booking Payment.status COMPLETED) in range. */
  bookingRevenueCents: number;
  completedBookingPaymentsCount: number;
  bookingsCreatedCount: number;
  confirmedOrCompletedBookingsCount: number;
  promotionRevenueCents: number;
  paidPromotionOrdersCount: number;
  salesAssistEntriesCount: number;
  salesAssistConvertedCount: number;
  salesAssistConversionRate: number | null;
  referralSignupsInRange: number;
  referralRewardsCountInRange: number;
  automationEventsInRange: number;
  grandTotalRevenueCents: number;
};

export type BnhubRevenueDashboardInput = {
  rangeDays: number;
  rangeStart: Date;
  rangeEnd: Date;
  bookingRevenueCents: number;
  completedBookingPaymentsCount: number;
  bookingsCreatedCount: number;
  confirmedOrCompletedBookingsCount: number;
  promotionRevenueCents: number;
  paidPromotionOrdersCount: number;
  salesAssistEntriesCount: number;
  salesAssistConvertedCount: number;
  referralSignupsInRange: number;
  referralRewardsCountInRange: number;
  automationEventsInRange: number;
};

const PAID_PROMOTION_STATUSES = ["paid", "active", "completed"] as const;

/** Pure aggregation for tests and reporting. */
export function buildBnhubRevenueDashboardSnapshot(
  input: BnhubRevenueDashboardInput
): BnhubRevenueDashboardSnapshot {
  const salesAssistConversionRate =
    input.salesAssistEntriesCount > 0
      ? input.salesAssistConvertedCount / input.salesAssistEntriesCount
      : null;
  const grandTotalRevenueCents = input.bookingRevenueCents + input.promotionRevenueCents;
  return {
    rangeDays: input.rangeDays,
    rangeStart: input.rangeStart.toISOString(),
    rangeEnd: input.rangeEnd.toISOString(),
    bookingRevenueCents: input.bookingRevenueCents,
    completedBookingPaymentsCount: input.completedBookingPaymentsCount,
    bookingsCreatedCount: input.bookingsCreatedCount,
    confirmedOrCompletedBookingsCount: input.confirmedOrCompletedBookingsCount,
    promotionRevenueCents: input.promotionRevenueCents,
    paidPromotionOrdersCount: input.paidPromotionOrdersCount,
    salesAssistEntriesCount: input.salesAssistEntriesCount,
    salesAssistConvertedCount: input.salesAssistConvertedCount,
    salesAssistConversionRate,
    referralSignupsInRange: input.referralSignupsInRange,
    referralRewardsCountInRange: input.referralRewardsCountInRange,
    automationEventsInRange: input.automationEventsInRange,
    grandTotalRevenueCents,
  };
}

export async function computeBnhubRevenueDashboard(rangeDays: number): Promise<BnhubRevenueDashboardSnapshot> {
  const days = Math.min(365, Math.max(1, Math.floor(rangeDays)));
  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 24 * 60 * 60 * 1000);

  const [
    paymentAgg,
    bookingsCreated,
    bookingsConfirmed,
    promoAgg,
    salesTotal,
    salesConverted,
    referralSignups,
    referralRewards,
    automationCount,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: rangeStart, lte: rangeEnd },
      },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.booking.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
    prisma.bnhubPromotionOrder.aggregate({
      where: {
        status: { in: [...PAID_PROMOTION_STATUSES] },
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.bnhubSalesAssistEntry.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.bnhubSalesAssistEntry.count({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
        convertedBookingId: { not: null },
      },
    }),
    prisma.referral.count({
      where: {
        usedAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
    prisma.referralReward.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.bnhubAutomationEvent.count({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
  ]);

  return buildBnhubRevenueDashboardSnapshot({
    rangeDays: days,
    rangeStart,
    rangeEnd,
    bookingRevenueCents: paymentAgg._sum.amountCents ?? 0,
    completedBookingPaymentsCount: paymentAgg._count,
    bookingsCreatedCount: bookingsCreated,
    confirmedOrCompletedBookingsCount: bookingsConfirmed,
    promotionRevenueCents: promoAgg._sum.amountCents ?? 0,
    paidPromotionOrdersCount: promoAgg._count,
    salesAssistEntriesCount: salesTotal,
    salesAssistConvertedCount: salesConverted,
    referralSignupsInRange: referralSignups,
    referralRewardsCountInRange: referralRewards,
    automationEventsInRange: automationCount,
  });
}
