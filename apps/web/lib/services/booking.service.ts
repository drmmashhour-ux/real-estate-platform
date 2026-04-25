/**
 * Cross-domain reads: Booking lives in `analytics` extract; guest `User` in `core`.
 * (LECIPM uses guestId, not userId.)
 */
import { analyticsDb } from "@/lib/prisma/analytics";
import { coreDb } from "@/lib/prisma/core";
import { joinByForeignKey } from "@/lib/utils/join-by-id";

export async function getBookingsFull() {
  const bookings = await analyticsDb.booking.findMany({
    orderBy: { createdAt: "desc" },
  });

  const guestIds = [...new Set(bookings.map((b) => b.guestId))];
  const users = await coreDb.user.findMany({
    where: { id: { in: guestIds } },
  });

  return joinByForeignKey(bookings, users, "guestId", "guest");
}
