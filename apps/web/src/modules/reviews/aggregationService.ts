import { prisma } from "@/lib/db";
import { syncHostBadgesFromPerformance } from "@/src/modules/reviews/badgeService";
import { computeAndUpsertHostQuality } from "@/lib/bnhub/host-quality";
import { scheduleFraudRecheck } from "@/src/workers/fraudDetectionWorker";

const CANCEL_STATUSES = new Set([
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "CANCELLED",
  "DECLINED",
]);

function linearHostScore(input: {
  responseRate: number;
  completionRate: number;
  cancellationRate: number;
  disputeRate: number;
}): number {
  return (
    input.responseRate * 30 +
    input.completionRate * 30 -
    input.cancellationRate * 20 -
    input.disputeRate * 20
  );
}

/** Map roughly [-20, 60] → [0, 100]. */
export function normalizeHostScore(linear: number): number {
  const min = -20;
  const max = 60;
  const clamped = Math.min(max, Math.max(min, linear));
  const n = ((clamped - min) / (max - min)) * 100;
  return Math.round(n * 10) / 10;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Recompute denormalized averages for a BNHub listing from public (non-held) guest reviews.
 */
export async function updatePropertyRating(listingId: string) {
  const reviews = await prisma.review.findMany({
    where: { listingId, moderationHeld: false },
    select: {
      propertyRating: true,
      cleanlinessRating: true,
      accuracyRating: true,
      communicationRating: true,
      locationRating: true,
      valueRating: true,
      checkinRating: true,
    },
  });

  const n = reviews.length;
  if (n === 0) {
    await prisma.propertyRatingAggregate.upsert({
      where: { listingId },
      create: {
        listingId,
        avgRating: 0,
        totalReviews: 0,
        cleanlinessAvg: 0,
        accuracyAvg: 0,
        communicationAvg: 0,
        locationAvg: 0,
        valueAvg: 0,
        checkinAvg: 0,
      },
      update: {
        avgRating: 0,
        totalReviews: 0,
        cleanlinessAvg: 0,
        accuracyAvg: 0,
        communicationAvg: 0,
        locationAvg: 0,
        valueAvg: 0,
        checkinAvg: 0,
      },
    });
    return prisma.propertyRatingAggregate.findUnique({ where: { listingId } });
  }

  const overall = mean(reviews.map((r) => r.propertyRating));
  const cleanlinessAvg = mean(
    reviews.map((r) => r.cleanlinessRating ?? r.propertyRating)
  );
  const accuracyAvg = mean(reviews.map((r) => r.accuracyRating ?? r.propertyRating));
  const communicationAvg = mean(
    reviews.map((r) => r.communicationRating ?? r.propertyRating)
  );
  const locationAvg = mean(reviews.map((r) => r.locationRating ?? r.propertyRating));
  const valueAvg = mean(reviews.map((r) => r.valueRating ?? r.propertyRating));
  const checkinAvg = mean(reviews.map((r) => r.checkinRating ?? r.propertyRating));

  return prisma.propertyRatingAggregate.upsert({
    where: { listingId },
    create: {
      listingId,
      avgRating: overall,
      totalReviews: n,
      cleanlinessAvg,
      accuracyAvg,
      communicationAvg,
      locationAvg,
      valueAvg,
      checkinAvg,
    },
    update: {
      avgRating: overall,
      totalReviews: n,
      cleanlinessAvg,
      accuracyAvg,
      communicationAvg,
      locationAvg,
      valueAvg,
      checkinAvg,
    },
  });
}

/**
 * Host operational metrics + 0–100 score from bookings, messages, and disputes.
 */
export async function updateHostPerformance(hostId: string) {
  const bookings = await prisma.booking.findMany({
    where: { listing: { ownerId: hostId } },
    select: {
      id: true,
      status: true,
      guestId: true,
      listing: { select: { ownerId: true } },
    },
  });

  const terminal = bookings.filter(
    (b) => b.status !== "PENDING" && b.status !== "AWAITING_HOST_APPROVAL"
  );
  const terminalCount = Math.max(1, terminal.length);
  const completed = terminal.filter((b) => b.status === "COMPLETED").length;
  const cancelled = terminal.filter((b) => CANCEL_STATUSES.has(b.status)).length;
  const completionRate = completed / terminalCount;
  const cancellationRate = cancelled / terminalCount;

  const disputeCount = await prisma.dispute.count({
    where: { listing: { ownerId: hostId } },
  });
  const disputeRate = Math.min(1, disputeCount / terminalCount);

  const bookingIds = bookings.map((b) => b.id);
  const messages =
    bookingIds.length === 0
      ? []
      : await prisma.bookingMessage.findMany({
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
    responseMs.length === 0
      ? 0
      : mean(responseMs) / (1000 * 60 * 60);

  const linear = linearHostScore({
    responseRate,
    completionRate,
    cancellationRate,
    disputeRate,
  });
  const score = normalizeHostScore(linear);

  const row = await prisma.hostPerformance.upsert({
    where: { hostId },
    create: {
      hostId,
      responseRate,
      avgResponseTime: avgResponseTimeHours,
      cancellationRate,
      completionRate,
      disputeRate,
      score,
    },
    update: {
      responseRate,
      avgResponseTime: avgResponseTimeHours,
      cancellationRate,
      completionRate,
      disputeRate,
      score,
    },
  });

  await syncHostBadgesFromPerformance(hostId, {
    score: row.score,
    responseRate: row.responseRate,
    cancellationRate: row.cancellationRate,
  });
  void computeAndUpsertHostQuality(hostId);

  scheduleFraudRecheck("host", hostId);

  return row;
}
