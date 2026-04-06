import { BnhubDayAvailabilityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type HostCalendarBookingEvent = {
  kind: "booking";
  id: string;
  listingId: string;
  listingTitle: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  paymentStatus: string | null;
};

export type HostCalendarBlockedEvent = {
  kind: "blocked";
  listingId: string;
  listingTitle: string;
  date: string;
};

export async function getHostCalendarEvents(
  hostId: string,
  params: { listingId?: string; from: Date; to: Date }
): Promise<{ bookings: HostCalendarBookingEvent[]; blocked: HostCalendarBlockedEvent[] }> {
  const listingWhere = {
    ownerId: hostId,
    ...(params.listingId?.trim() ? { id: params.listingId.trim() } : {}),
  };

  const listings = await prisma.shortTermListing.findMany({
    where: listingWhere,
    select: { id: true, title: true },
  });
  const ids = listings.map((l) => l.id);
  const titleById = new Map(listings.map((l) => [l.id, l.title]));

  if (!ids.length) {
    return { bookings: [], blocked: [] };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: ids },
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

  return {
    bookings: bookings.map((b) => ({
      kind: "booking" as const,
      id: b.id,
      listingId: b.listingId,
      listingTitle: titleById.get(b.listingId) ?? "Listing",
      title:
        b.guestContactName?.trim() || b.guest?.name?.trim() || `Booking ${b.id.slice(0, 6)}`,
      start: b.checkIn,
      end: b.checkOut,
      status: b.status,
      paymentStatus: b.payment?.status ?? null,
    })),
    blocked: blockedSlots.map((s) => ({
      kind: "blocked" as const,
      listingId: s.listingId,
      listingTitle: titleById.get(s.listingId) ?? "Listing",
      date: s.date.toISOString().slice(0, 10),
    })),
  };
}
