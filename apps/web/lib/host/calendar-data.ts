import {
  BnhubChannelEventSource,
  BnhubChannelPlatform,
  BnhubDayAvailabilityStatus,
  BookingStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";

/** Hidden from host calendar grid (same spirit as mobile host calendar API). */
export const HOST_CALENDAR_HIDDEN_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.DECLINED,
  BookingStatus.EXPIRED,
];

export type HostCalendarBookingEvent = {
  kind: "booking";
  id: string;
  listingId: string;
  listingTitle: string;
  /** Per-listing color for FullCalendar (`ShortTermListing.calendarColor`). */
  listingColor: string | null;
  title: string;
  start: Date;
  end: Date;
  status: string;
  paymentStatus: string | null;
};

/** JSON passed from the host calendar RSC to the client (ISO start/end). */
export type HostCalendarBookingEventSerialized = Omit<HostCalendarBookingEvent, "start" | "end"> & {
  start: string;
  end: string;
};

export type HostCalendarBlockedEvent = {
  kind: "blocked";
  listingId: string;
  listingTitle: string;
  date: string;
  /** Availability slot / host block (not ICS import). */
  fromAvailabilitySlot?: boolean;
  /** When night came from unified `ExternalCalendarEvent` ICS import. */
  icsSourceName?: string | null;
};

export type HostChannelCalendarEvent = {
  kind: "channel";
  id: string;
  listingId: string;
  listingTitle: string;
  platform: BnhubChannelPlatform;
  summary: string;
  start: Date;
  /** Exclusive end instant for calendar rendering. */
  endExclusive: Date;
};

export type HostChannelCalendarEventSerialized = Omit<HostChannelCalendarEvent, "start" | "endExclusive"> & {
  start: string;
  endExclusive: string;
};

export async function getHostCalendarEvents(
  hostId: string,
  params: { listingId?: string; from: Date; to: Date }
): Promise<{
  bookings: HostCalendarBookingEvent[];
  blocked: HostCalendarBlockedEvent[];
  channelEvents: HostChannelCalendarEvent[];
}> {
  const listingWhere = {
    ownerId: hostId,
    ...(params.listingId?.trim() ? { id: params.listingId.trim() } : {}),
  };

  const listings = await prisma.shortTermListing.findMany({
    where: listingWhere,
    select: { id: true, title: true, calendarColor: true },
  });
  const ids = listings.map((l) => l.id);
  const titleById = new Map(listings.map((l) => [l.id, l.title]));
  const colorById = new Map(listings.map((l) => [l.id, l.calendarColor]));

  if (!ids.length) {
    return { bookings: [], blocked: [], channelEvents: [] };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: ids },
      status: { notIn: HOST_CALENDAR_HIDDEN_BOOKING_STATUSES },
      checkIn: { lt: params.to },
      checkOut: { gt: params.from },
    },
    select: {
      id: true,
      listingId: true,
      status: true,
      checkIn: true,
      checkOut: true,
      guestContactName: true,
      guest: { select: { name: true } },
      payment: { select: { status: true } },
    },
  });

  const startDay = new Date(params.from);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(params.to);
  endDay.setUTCHours(23, 59, 59, 999);

  const blockedSlots = await prisma.availabilitySlot.findMany({
    where: {
      listingId: { in: ids },
      date: { gte: startDay, lte: endDay },
      OR: [
        { available: false },
        { dayStatus: { in: [BnhubDayAvailabilityStatus.BLOCKED, BnhubDayAvailabilityStatus.BOOKED] } },
      ],
    },
    select: { listingId: true, date: true },
  });

  const icsExternals = await prisma.externalCalendarEvent.findMany({
    where: {
      listingId: { in: ids },
      status: "blocked",
      startDate: { lt: params.to },
      endDate: { gt: params.from },
    },
    select: { listingId: true, startDate: true, endDate: true, sourceName: true },
  });

  const channelRows = await prisma.bnhubChannelCalendarEvent.findMany({
    where: {
      listingId: { in: ids },
      source: BnhubChannelEventSource.EXTERNAL,
      startDate: { lte: endDay },
      endDate: { gte: startDay },
    },
    select: {
      id: true,
      listingId: true,
      platform: true,
      guestName: true,
      startDate: true,
      endDate: true,
      eventType: true,
    },
  });

  const blockedByKey = new Map<string, HostCalendarBlockedEvent>();
  for (const s of blockedSlots) {
    const dateStr = s.date.toISOString().slice(0, 10);
    const k = `${s.listingId}:${dateStr}`;
    blockedByKey.set(k, {
      kind: "blocked",
      listingId: s.listingId,
      listingTitle: titleById.get(s.listingId) ?? "Listing",
      date: dateStr,
      fromAvailabilitySlot: true,
    });
  }
  for (const ev of icsExternals) {
    const nights = eachNightBetween(ev.startDate, ev.endDate);
    for (const n of nights) {
      const dateStr = utcDayStart(n).toISOString().slice(0, 10);
      const k = `${ev.listingId}:${dateStr}`;
      if (!blockedByKey.has(k)) {
        blockedByKey.set(k, {
          kind: "blocked",
          listingId: ev.listingId,
          listingTitle: titleById.get(ev.listingId) ?? "Listing",
          date: dateStr,
          icsSourceName: ev.sourceName ?? null,
        });
      }
    }
  }

  const channelEvents: HostChannelCalendarEvent[] = channelRows.map((ev) => {
    const start = utcDayStart(ev.startDate);
    const endExclusive = new Date(utcDayStart(ev.endDate).getTime() + 86400000);
    const summary =
      ev.guestName?.trim() ||
      (ev.eventType === "BLOCK" ? "Blocked (channel)" : "Reservation (channel)");
    return {
      kind: "channel" as const,
      id: ev.id,
      listingId: ev.listingId,
      listingTitle: titleById.get(ev.listingId) ?? "Listing",
      platform: ev.platform,
      summary,
      start,
      endExclusive,
    };
  });

  return {
    bookings: bookings.map((b) => ({
      kind: "booking" as const,
      id: b.id,
      listingId: b.listingId,
      listingTitle: titleById.get(b.listingId) ?? "Listing",
      listingColor: colorById.get(b.listingId) ?? null,
      title:
        b.guestContactName?.trim() || b.guest?.name?.trim() || `Booking ${b.id.slice(0, 6)}`,
      start: b.checkIn,
      end: b.checkOut,
      status: b.status,
      paymentStatus: b.payment?.status ?? null,
    })),
    blocked: [...blockedByKey.values()],
    channelEvents,
  };
}
