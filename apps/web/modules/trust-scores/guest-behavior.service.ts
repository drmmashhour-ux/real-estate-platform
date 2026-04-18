import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";

export async function computeGuestBookingBehavior(guestUserId: string) {
  const bookings = await prisma.booking.findMany({
    where: { guestId: guestUserId },
    select: { status: true },
    take: 300,
  });
  const CANCELLED: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.CANCELLED_BY_GUEST,
    BookingStatus.CANCELLED_BY_HOST,
  ];
  let completed = 0;
  let cancelled = 0;
  for (const b of bookings) {
    if (b.status === BookingStatus.COMPLETED) completed += 1;
    if (CANCELLED.includes(b.status)) cancelled += 1;
  }
  const n = bookings.length;
  return {
    sampleSize: n,
    completed,
    cancelled,
    completionRate: n > 0 ? completed / n : 0,
  };
}
