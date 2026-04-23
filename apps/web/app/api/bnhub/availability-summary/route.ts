import { BnhubDayAvailabilityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAvailability } from "@/src/modules/bnhub/application/bookingService";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { prisma } from "@repo/db";
import { detectConflicts } from "@/src/modules/bnhub-channel-manager";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });
  try {
    const availability = await getAvailability(listingId);

    const rangeStart = utcDayStart(new Date());
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 120);

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        listingId,
        date: { gte: rangeStart, lte: rangeEnd },
        OR: [
          { available: false },
          {
            dayStatus: {
              in: [BnhubDayAvailabilityStatus.BOOKED, BnhubDayAvailabilityStatus.BLOCKED],
            },
          },
        ],
      },
      select: { date: true, bookedByBookingId: true, dayStatus: true },
    });

    const externalBlockedDates = [
      ...new Set(
        slots
          .filter(
            (s) =>
              !s.bookedByBookingId &&
              (s.dayStatus === BnhubDayAvailabilityStatus.BOOKED ||
                s.dayStatus === BnhubDayAvailabilityStatus.BLOCKED)
          )
          .map((s) => s.date.toISOString().slice(0, 10))
      ),
    ].sort();

    const conflictRows = await detectConflicts(listingId);
    const conflictDates = conflictRows.map((c) => c.date);

    const unavailable = new Set([...availability.bookedDates, ...externalBlockedDates]);
    const start = new Date();
    const next30: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      next30.push(d.toISOString().slice(0, 10));
    }
    const availableDates = next30.filter((d) => !unavailable.has(d));

    return NextResponse.json({
      bookedDates: availability.bookedDates,
      availableDates,
      externalBlockedDates,
      conflictDates,
      calendarLegend: {
        bnhub: "Reservation on BNHUB",
        external: "Unavailable (imported calendar / other channel)",
        conflict: "Overlap — review in Channel Manager",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

