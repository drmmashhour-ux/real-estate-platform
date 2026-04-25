import type { PrismaClient } from "@prisma/client";
import { BookingStatus } from "@prisma/client";

const CANCEL_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
];

export type RawHostReputationSignals = {
  hostId: string;
  terminalBookingCount: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  cancellationRate: number;
  disputeCount: number;
  disputeRate: number;
  responseRate: number;
  avgResponseTimeHours: number;
  withGuestMessageCount: number;
  completedStaysCount: number;
  checklistDeclaredOnCompletedCount: number;
  reviewWeightedAverage: number | null;
  totalReviewCount: number;
  /** Share of bookings (all statuses) where guest had a prior booking with this host */
  repeatGuestBookingShare: number;
  totalBookingsAll: number;
};

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Loads real host behavior signals for reputation scoring (bookings, messages, disputes, reviews, checklist).
 */
export async function loadHostReputationSignals(
  db: PrismaClient,
  hostId: string,
): Promise<RawHostReputationSignals> {
  const bookings = await db.booking.findMany({
    where: { listing: { ownerId: hostId } },
    select: {
      id: true,
      status: true,
      guestId: true,
      createdAt: true,
      checklistDeclaredByHostAt: true,
      listing: { select: { ownerId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const terminal = bookings.filter(
    (b) => b.status !== BookingStatus.PENDING && b.status !== BookingStatus.AWAITING_HOST_APPROVAL,
  );
  const terminalCount = Math.max(1, terminal.length);
  const completedCount = terminal.filter((b) => b.status === BookingStatus.COMPLETED).length;
  const cancelledCount = terminal.filter((b) => CANCEL_STATUSES.includes(b.status)).length;
  const completionRate = completedCount / terminalCount;
  const cancellationRate = cancelledCount / terminalCount;

  const disputeCount = await db.dispute.count({
    where: { listing: { ownerId: hostId } },
  });
  const disputeRate = Math.min(1, disputeCount / terminalCount);

  const bookingIds = bookings.map((b) => b.id);
  const messages =
    bookingIds.length === 0
      ? []
      : await db.bookingMessage.findMany({
          where: { bookingId: { in: bookingIds } },
          orderBy: { createdAt: "asc" },
          select: { bookingId: true, senderId: true, createdAt: true },
        });

  const byBooking = new Map<string, typeof messages>();
  for (const m of messages) {
    const arr = byBooking.get(m.bookingId) ?? [];
    arr.push(m);
    byBooking.set(m.bookingId, arr);
  }

  let responded = 0;
  let withGuestMessage = 0;
  const responseMs: number[] = [];

  for (const b of bookings) {
    const list = byBooking.get(b.id) ?? [];
    const ownerId = b.listing.ownerId;
    const guestId = b.guestId;
    let firstGuestAt: Date | null = null;
    for (const m of list) {
      if (m.senderId === guestId) {
        firstGuestAt = m.createdAt;
        break;
      }
    }
    if (!firstGuestAt) continue;
    withGuestMessage += 1;
    let firstHostAfter: (typeof messages)[0] | undefined;
    for (const m of list) {
      if (m.createdAt > firstGuestAt && m.senderId === ownerId) {
        firstHostAfter = m;
        break;
      }
    }
    if (firstHostAfter) {
      responded += 1;
      responseMs.push(firstHostAfter.createdAt.getTime() - firstGuestAt.getTime());
    }
  }

  const responseRate = withGuestMessage === 0 ? 1 : responded / withGuestMessage;
  const avgResponseTimeHours =
    responseMs.length === 0 ? 0 : mean(responseMs) / (1000 * 60 * 60);

  const completedStaysCount = bookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
  const checklistDeclaredOnCompletedCount = bookings.filter(
    (b) => b.status === BookingStatus.COMPLETED && b.checklistDeclaredByHostAt != null,
  ).length;

  const aggs = await db.propertyRatingAggregate.findMany({
    where: { listing: { ownerId: hostId } },
    select: { avgRating: true, totalReviews: true },
  });
  let reviewWeightedAverage: number | null = null;
  let totalReviewCount = 0;
  let weightedSum = 0;
  for (const a of aggs) {
    const n = a.totalReviews ?? 0;
    if (n <= 0) continue;
    totalReviewCount += n;
    weightedSum += (a.avgRating ?? 0) * n;
  }
  if (totalReviewCount > 0) {
    reviewWeightedAverage = weightedSum / totalReviewCount;
  }

  const guestsSeen = new Set<string>();
  let repeatBookingEvents = 0;
  for (const b of bookings) {
    if (guestsSeen.has(b.guestId)) repeatBookingEvents += 1;
    guestsSeen.add(b.guestId);
  }
  const totalBookingsAll = bookings.length;
  const repeatGuestBookingShare =
    totalBookingsAll <= 0 ? 0 : Math.min(1, repeatBookingEvents / totalBookingsAll);

  return {
    hostId,
    terminalBookingCount: terminal.length,
    completedCount,
    cancelledCount,
    completionRate,
    cancellationRate,
    disputeCount,
    disputeRate,
    responseRate,
    avgResponseTimeHours,
    withGuestMessageCount: withGuestMessage,
    completedStaysCount,
    checklistDeclaredOnCompletedCount,
    reviewWeightedAverage,
    totalReviewCount,
    repeatGuestBookingShare,
    totalBookingsAll,
  };
}
