import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emitPlatformAutonomyEvent } from "@/lib/autonomy/emit-platform-event";

/**
 * Emits `BOOKING_ABANDONED` for stale guest checkouts (deduped per booking).
 */
export async function enqueueAbandonedBookingEvents(limit = 30): Promise<number> {
  const stale = new Date(Date.now() - 48 * 3600000);
  const rows = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      updatedAt: { lt: stale },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, guestId: true, listingId: true },
  });

  let n = 0;
  for (const b of rows) {
    const id = await emitPlatformAutonomyEvent({
      eventType: "BOOKING_ABANDONED",
      entityType: "booking",
      entityId: b.id,
      userId: b.guestId,
      payload: { listingId: b.listingId, bookingId: b.id },
      dedupeKey: `booking_abandoned:${b.id}`,
    });
    if (id) n += 1;
  }
  return n;
}
