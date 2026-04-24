import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireBnhubHostAccess, assertHostOwnsListing } from "@/lib/host/require-bnhub-host-access";
import { getHostCalendarEvents } from "@/lib/host/calendar-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/calendar?listingId=&from=ISO&to=ISO
 * Booked nights from `Booking` rows; blocked nights from `AvailabilitySlot` + external ICS (see `getHostCalendarEvents`).
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const sp = req.nextUrl.searchParams;
  const listingId = sp.get("listingId")?.trim() || undefined;
  if (listingId && !(await assertHostOwnsListing(gate.userId, listingId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const fromRaw = sp.get("from");
  const toRaw = sp.get("to");
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 7 * 86400000);
  const to = toRaw ? new Date(toRaw) : new Date(now.getTime() + 370 * 86400000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return Response.json({ error: "Invalid from/to" }, { status: 400 });
  }
  if (to.getTime() <= from.getTime()) {
    return Response.json({ error: "to must be after from" }, { status: 400 });
  }

  const { bookings, blocked, channelEvents } = await getHostCalendarEvents(gate.userId, {
    listingId,
    from,
    to,
  });

  return Response.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    listingId: listingId ?? null,
    booked: bookings.map((b) => ({
      bookingId: b.id,
      listingId: b.listingId,
      checkIn: b.start.toISOString(),
      checkOut: b.end.toISOString(),
      status: b.status,
      paymentStatus: b.paymentStatus,
      title: b.title,
    })),
    blockedNights: blocked.map((b) => ({
      listingId: b.listingId,
      date: b.date,
      fromAvailabilitySlot: b.fromAvailabilitySlot ?? false,
      icsSourceName: b.icsSourceName ?? null,
    })),
    channelEvents: channelEvents.map((c) => ({
      id: c.id,
      listingId: c.listingId,
      platform: c.platform,
      summary: c.summary,
      start: c.start.toISOString(),
      endExclusive: c.endExclusive.toISOString(),
    })),
  });
}
