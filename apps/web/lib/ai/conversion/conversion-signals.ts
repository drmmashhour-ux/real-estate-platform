import type { Prisma, PrismaClient } from "@prisma/client";
import { BehaviorEventType, BookingStatus, SearchEventType } from "@prisma/client";
import type { ConversionEventType } from "./conversion-types";

export const CONVERSION_SIGNAL_EVENT_TYPES: readonly ConversionEventType[] = [
  "listing_view",
  "listing_click",
  "booking_started",
  "booking_completed",
  "booking_abandoned",
  "message_sent_to_host",
  "message_response_received",
] as const;

export type AggregatedConversionCounts = {
  searchViews: number;
  searchClicks: number;
  behaviorImpressions: number;
  behaviorClicks: number;
  bookingAttempts: number;
  aiSignalsByType: Partial<Record<ConversionEventType, number>>;
  bookingsCreated: number;
  bookingsCompleted: number;
  bookingsAbandoned: number;
  /** Guest-originated thread messages (real messaging volume). */
  messagesFromGuests: number;
  /** Host replies on listing bookings (response signal). */
  messagesFromHost: number;
};

/**
 * Persists an explicit conversion signal (optional guest id).
 */
export async function recordAiConversionSignal(
  db: PrismaClient,
  input: {
    listingId: string;
    guestId?: string | null;
    eventType: ConversionEventType;
    metadata?: Record<string, unknown>;
  },
): Promise<{ id: string }> {
  const row = await db.aiConversionSignal.create({
    data: {
      listingId: input.listingId,
      guestId: input.guestId ?? undefined,
      eventType: input.eventType,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return row;
}

/**
 * Aggregates real platform events for a listing in [since, now].
 * `hostUserId` splits booking messages into guest vs host (no fabricated message events).
 */
export async function loadAggregatedConversionCounts(
  db: PrismaClient,
  listingId: string,
  hostUserId: string,
  since: Date,
): Promise<AggregatedConversionCounts> {
  const [
    searchViews,
    searchClicks,
    behaviorImpressions,
    behaviorClicks,
    bookingAttempts,
    aiGrouped,
    bookingsCreated,
    bookingsCompleted,
    bookingsAbandoned,
    messagesFromGuests,
    messagesFromHost,
  ] = await Promise.all([
    db.searchEvent.count({
      where: {
        listingId,
        eventType: SearchEventType.VIEW,
        createdAt: { gte: since },
      },
    }),
    db.searchEvent.count({
      where: {
        listingId,
        eventType: SearchEventType.CLICK,
        createdAt: { gte: since },
      },
    }),
    db.userBehaviorEvent.count({
      where: {
        listingId,
        eventType: BehaviorEventType.LISTING_IMPRESSION,
        createdAt: { gte: since },
      },
    }),
    db.userBehaviorEvent.count({
      where: {
        listingId,
        eventType: BehaviorEventType.LISTING_CLICK,
        createdAt: { gte: since },
      },
    }),
    db.userBehaviorEvent.count({
      where: {
        listingId,
        eventType: BehaviorEventType.LISTING_BOOKING_ATTEMPT,
        createdAt: { gte: since },
      },
    }),
    db.aiConversionSignal.groupBy({
      by: ["eventType"],
      where: { listingId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.booking.count({
      where: { listingId, createdAt: { gte: since } },
    }),
    db.booking.count({
      where: {
        listingId,
        createdAt: { gte: since },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    db.booking.count({
      where: {
        listingId,
        createdAt: { gte: since },
        status: {
          in: [
            BookingStatus.EXPIRED,
            BookingStatus.CANCELLED_BY_GUEST,
            BookingStatus.CANCELLED_BY_HOST,
            BookingStatus.CANCELLED,
          ],
        },
      },
    }),
    db.bookingMessage.count({
      where: {
        createdAt: { gte: since },
        booking: { listingId },
        senderId: { not: hostUserId },
      },
    }),
    db.bookingMessage.count({
      where: {
        createdAt: { gte: since },
        booking: { listingId },
        senderId: hostUserId,
      },
    }),
  ]);

  const aiSignalsByType: Partial<Record<ConversionEventType, number>> = {};
  for (const row of aiGrouped) {
    const k = row.eventType as ConversionEventType;
    if (CONVERSION_SIGNAL_EVENT_TYPES.includes(k)) {
      aiSignalsByType[k] = row._count._all;
    }
  }

  return {
    searchViews,
    searchClicks,
    behaviorImpressions,
    behaviorClicks,
    bookingAttempts,
    aiSignalsByType,
    bookingsCreated,
    bookingsCompleted,
    bookingsAbandoned,
    messagesFromGuests,
    messagesFromHost,
  };
}
