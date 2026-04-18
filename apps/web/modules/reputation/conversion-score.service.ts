import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";

/** 0–100 from completed vs cancelled bookings (real transaction data). */
export async function computeListingConversionScore(listingId: string): Promise<number> {
  const rows = await prisma.booking.groupBy({
    by: ["status"],
    where: { listingId },
    _count: { _all: true },
  });
  const CANCELLED: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.CANCELLED_BY_GUEST,
    BookingStatus.CANCELLED_BY_HOST,
  ];
  let completed = 0;
  let cancelled = 0;
  let total = 0;
  for (const r of rows) {
    const c = r._count._all;
    total += c;
    if (r.status === BookingStatus.COMPLETED) completed += c;
    if (CANCELLED.includes(r.status)) cancelled += c;
  }
  if (total === 0) return 50;
  const completionRatio = completed / total;
  const cancelRatio = cancelled / total;
  return Math.round(Math.min(100, Math.max(0, completionRatio * 75 + (1 - cancelRatio) * 25)));
}
