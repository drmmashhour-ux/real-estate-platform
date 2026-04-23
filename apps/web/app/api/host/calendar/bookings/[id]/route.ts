import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  releaseBookedSlotsForBooking,
  upsertBookedNightsForBooking,
} from "@/lib/bnhub/availability-day-helpers";
import {
  expireStaleBnhubPendingBookings,
} from "@/lib/bookings/checkAvailability";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const RESCHEDULABLE: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.CONFIRMED,
];

/**
 * PATCH — Host drags a booking on the calendar (updates check-in / check-out).
 * Pricing fields are unchanged; refine in a later phase when a pricing engine is wired.
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await ctx.params;
    const body = await req.json();
    const checkInRaw = body?.checkIn;
    const checkOutRaw = body?.checkOut;
    if (typeof checkInRaw !== "string" || typeof checkOutRaw !== "string") {
      return NextResponse.json({ error: "checkIn and checkOut (ISO strings) required" }, { status: 400 });
    }

    const checkIn = new Date(checkInRaw);
    const checkOut = new Date(checkOutRaw);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (!(checkIn < checkOut)) {
      return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 });
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    if (nights < 1) {
      return NextResponse.json({ error: "Stay must be at least one night" }, { status: 400 });
    }

    const existing = await prisma.booking.findFirst({
      where: { id: bookingId, listing: { ownerId: userId } },
      select: { id: true, listingId: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (!RESCHEDULABLE.includes(existing.status)) {
      return NextResponse.json({ error: "Booking cannot be rescheduled in this status" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await expireStaleBnhubPendingBookings(tx, existing.listingId);

      const clash = await tx.booking.findFirst({
        where: {
          listingId: existing.listingId,
          id: { not: bookingId },
          status: { in: ["CONFIRMED", "PENDING", "AWAITING_HOST_APPROVAL"] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
        select: { id: true },
      });
      if (clash) {
        throw new Error("OVERLAP");
      }

      await releaseBookedSlotsForBooking(tx, bookingId);
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          checkIn,
          checkOut,
          nights,
        },
      });
      await upsertBookedNightsForBooking(tx, {
        listingId: existing.listingId,
        checkIn,
        checkOut,
        bookingId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "OVERLAP") {
      return NextResponse.json({ error: "Dates already booked" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
