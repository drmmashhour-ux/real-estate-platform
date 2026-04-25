/**
 * Application-level “relation”: `Booking` is on the split **analytics** client; `User` is on **core**
 * (Prisma has no cross-client include — batch-load users and join in memory).
 *
 * LECIPM `Booking` uses `guestId` (not `userId`); the joined object is exposed as `user` for a stable API.
 */
import { analyticsDb } from "@/lib/prisma/analytics";
import { coreDb } from "@/lib/prisma/core";
import { joinByForeignKey } from "@/lib/utils/join-by-id";

export async function getBookingsFull() {
  const bookings = await analyticsDb.booking.findMany({
    orderBy: { createdAt: "desc" },
  });
  if (bookings.length === 0) return [];

  const guestIds = [...new Set(bookings.map((b) => b.guestId))];
  const users = await coreDb.user.findMany({
    where: { id: { in: guestIds } },
  });

  return joinByForeignKey(bookings, users, "guestId", "user");
}
