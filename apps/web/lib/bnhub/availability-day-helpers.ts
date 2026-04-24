import type { Prisma } from "@prisma/client";
import { BnhubDayAvailabilityStatus } from "@prisma/client";

/** UTC midnight for calendar day keys (matches existing BNHUB availability patterns). */
export function utcDayStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Nights [checkIn, checkOut) as UTC day starts */
export function eachNightBetween(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  let cur = utcDayStart(checkIn);
  const end = utcDayStart(checkOut);
  while (cur < end) {
    nights.push(new Date(cur));
    cur = new Date(cur.getTime() + 86400000);
  }
  return nights;
}

export function slotBlocksBooking(slot: {
  available: boolean;
  dayStatus: BnhubDayAvailabilityStatus;
}): boolean {
  if (slot.dayStatus === BnhubDayAvailabilityStatus.BLOCKED || slot.dayStatus === BnhubDayAvailabilityStatus.BOOKED) {
    return true;
  }
  return !slot.available;
}

export async function upsertBookedNightsForBooking(
  tx: Prisma.TransactionClient,
  params: { listingId: string; checkIn: Date; checkOut: Date; bookingId: string }
): Promise<void> {
  const nights = eachNightBetween(params.checkIn, params.checkOut);
  for (const date of nights) {
    await tx.availabilitySlot.upsert({
      where: { listingId_date: { listingId: params.listingId, date } },
      create: {
        listingId: params.listingId,
        date,
        available: false,
        dayStatus: BnhubDayAvailabilityStatus.BOOKED,
        bookedByBookingId: params.bookingId,
      },
      update: {
        available: false,
        dayStatus: BnhubDayAvailabilityStatus.BOOKED,
        bookedByBookingId: params.bookingId,
      },
    });
  }
  if (nights.length > 0) {
    await tx.bookingNight.createMany({
      data: nights.map((stayDate) => ({
        listingId: params.listingId,
        stayDate,
        bookingId: params.bookingId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function releaseBookedSlotsForBooking(
  tx: Prisma.TransactionClient,
  bookingId: string
): Promise<void> {
  await tx.bookingNight.deleteMany({ where: { bookingId } });
  await tx.availabilitySlot.updateMany({
    where: { bookedByBookingId: bookingId },
    data: {
      available: true,
      dayStatus: BnhubDayAvailabilityStatus.AVAILABLE,
      bookedByBookingId: null,
    },
  });
}
