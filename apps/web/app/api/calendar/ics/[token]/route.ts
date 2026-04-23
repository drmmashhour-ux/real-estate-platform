import { BookingStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { buildListingIcsCalendar } from "@/modules/calendar/ics/ics-export";

export const dynamic = "force-dynamic";

const EXPORT_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const tokenTrimmed = decodeURIComponent(token).trim();
  if (!tokenTrimmed) {
    return new Response("Not found", { status: 404 });
  }

  const feed = await prisma.listingIcsFeed.findUnique({
    where: { token: tokenTrimmed },
    select: { listingId: true, isEnabled: true },
  });

  if (!feed || !feed.isEnabled) {
    return new Response("Not found", { status: 404 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: feed.listingId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!listing) {
    return new Response("Listing not found", { status: 404 });
  }

  const [bookings, externals] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId: listing.id,
        status: { in: EXPORT_BOOKING_STATUSES },
      },
      select: { id: true, checkIn: true, checkOut: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.externalCalendarEvent.findMany({
      where: { listingId: listing.id, status: "blocked" },
      select: { id: true, title: true, startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const bookingEvents = bookings.map((booking) => ({
    uid: `booking-${booking.id}@bnhub.local`,
    title: `${listing.title.slice(0, 80)} — Booked`,
    start: booking.checkIn,
    end: booking.checkOut,
  }));

  const externalEvents = externals.map((event) => ({
    uid: `external-${event.id}@bnhub.local`,
    title: `${listing.title.slice(0, 60)} — ${event.title?.trim() || "Blocked"}`,
    start: event.startDate,
    end: event.endDate,
  }));

  const ics = buildListingIcsCalendar(listing.title, [...bookingEvents, ...externalEvents]);

  await prisma.calendarSyncLog.create({
    data: {
      listingId: listing.id,
      direction: "export",
      status: "success",
      message: "ICS feed served",
      meta: {
        bookings: bookings.length,
        externalBlocks: externals.length,
      },
    },
  });

  const safeName = listing.title.replace(/[^\w\s-]/g, "").slice(0, 40) || "bnhub-calendar";

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeName}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
