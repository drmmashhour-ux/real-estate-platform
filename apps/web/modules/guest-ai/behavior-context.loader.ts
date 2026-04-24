/**
 * Loads recent, consent-aligned behavior for guest recommendations (server-only).
 */
import { BookingStatus, BehaviorEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GuestBehaviorSignals, GuestBookingHistoryEntry } from "./context.types";

const VIEW_TYPES: BehaviorEventType[] = [
  BehaviorEventType.LISTING_CLICK,
  BehaviorEventType.MAP_PIN_CLICK,
  BehaviorEventType.SIMILAR_LISTING_CLICK,
];

const SAVE_TYPES: BehaviorEventType[] = [BehaviorEventType.LISTING_SAVE];

const BEHAVIOR_LOOKBACK_MS = 90 * 86400000;

function uniq(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export async function loadGuestBehaviorSignals(args: {
  userId: string | null;
  sessionId: string | null;
}): Promise<GuestBehaviorSignals> {
  const since = new Date(Date.now() - BEHAVIOR_LOOKBACK_MS);
  const empty: GuestBehaviorSignals = {
    viewedListingIds: [],
    likedListingIds: [],
    bookingHistory: [],
  };

  if (!args.userId && !args.sessionId) return empty;

  const baseWhere = args.userId
    ? { userId: args.userId, createdAt: { gte: since } as const }
    : { sessionId: args.sessionId!, createdAt: { gte: since } as const };

  const [viewRows, saveRows, bookingRows] = await Promise.all([
    prisma.userBehaviorEvent.findMany({
      where: { ...baseWhere, eventType: { in: VIEW_TYPES }, listingId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: { listingId: true },
    }),
    prisma.userBehaviorEvent.findMany({
      where: { ...baseWhere, eventType: { in: SAVE_TYPES }, listingId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { listingId: true },
    }),
    args.userId
      ? prisma.booking.findMany({
          where: {
            guestId: args.userId,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          },
          orderBy: { checkIn: "desc" },
          take: 12,
          select: {
            listingId: true,
            listing: { select: { city: true } },
            checkOut: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const bookingHistory: GuestBookingHistoryEntry[] = bookingRows.map((b) => ({
    listingId: b.listingId,
    city: b.listing?.city ?? null,
    checkOut: b.checkOut?.toISOString?.() ?? null,
  }));

  return {
    viewedListingIds: uniq(viewRows.map((r) => r.listingId!).filter(Boolean)),
    likedListingIds: uniq(saveRows.map((r) => r.listingId!).filter(Boolean)),
    bookingHistory,
  };
}
