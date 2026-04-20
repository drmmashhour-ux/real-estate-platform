import { BnhubDayAvailabilityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import {
  expireStaleBnhubPendingBookings,
  findOverlappingActiveBnhubBooking,
} from "@/lib/bookings/checkAvailability";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST — Host blocks a single calendar night (AvailabilitySlot BLOCKED).
 * Safer than creating a fake Booking via `/api/bookings/create`.
 */
export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
    const dateStr = typeof body?.date === "string" ? body.date.trim() : "";
    if (!listingId || !dateStr) {
      return NextResponse.json({ error: "listingId and date required" }, { status: 400 });
    }

    const dayStart = utcDayStart(new Date(dateStr));
    if (Number.isNaN(dayStart.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await expireStaleBnhubPendingBookings(tx, listingId);
      const overlapBooking = await findOverlappingActiveBnhubBooking(tx, listingId, dayStart, dayEnd);
      if (overlapBooking) {
        throw new Error("BOOKING_CONFLICT");
      }

      const existing = await tx.availabilitySlot.findUnique({
        where: { listingId_date: { listingId, date: dayStart } },
        select: { bookedByBookingId: true, dayStatus: true },
      });
      if (existing?.bookedByBookingId || existing?.dayStatus === BnhubDayAvailabilityStatus.BOOKED) {
        throw new Error("BOOKED_DAY");
      }

      await tx.availabilitySlot.upsert({
        where: { listingId_date: { listingId, date: dayStart } },
        create: {
          listingId,
          date: dayStart,
          available: false,
          dayStatus: BnhubDayAvailabilityStatus.BLOCKED,
        },
        update: {
          available: false,
          dayStatus: BnhubDayAvailabilityStatus.BLOCKED,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && (e.message === "BOOKING_CONFLICT" || e.message === "BOOKED_DAY")) {
      return NextResponse.json({ error: "Dates already booked or blocked" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
