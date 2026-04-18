import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";

export async function computeHostReliabilitySignals(hostUserId: string) {
  const bookings = await prisma.booking.findMany({
    where: { listing: { ownerId: hostUserId } },
    select: { status: true },
    take: 500,
  });
  const CANCELLED: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.CANCELLED_BY_GUEST,
    BookingStatus.CANCELLED_BY_HOST,
  ];
  let total = bookings.length;
  let cancelled = 0;
  let completed = 0;
  for (const b of bookings) {
    if (b.status === BookingStatus.COMPLETED) completed += 1;
    if (CANCELLED.includes(b.status)) cancelled += 1;
  }
  const cancelRate = total > 0 ? cancelled / total : 0;
  return { sampleSize: total, completed, cancelled, cancelRate };
}
