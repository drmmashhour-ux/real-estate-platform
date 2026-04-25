import { addDays, subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { runHostLifecycleMessage } from "@/lib/ai/messaging/engine";

/**
 * Time-window scan for lifecycle triggers (cron). Idempotent via engine dedupe.
 */
export async function runScheduledHostLifecycleMessages(opts?: { limit?: number }): Promise<{
  processed: number;
  attempted: number;
}> {
  const now = new Date();
  const limit = Math.min(400, Math.max(1, opts?.limit ?? 200));
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      OR: [
        { checkIn: { gte: subDays(now, 1), lte: addDays(now, 3) } },
        { checkOut: { gte: subDays(now, 3), lte: addDays(now, 2) } },
      ],
    },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let attempted = 0;
  for (const b of bookings) {
    const msToCheckIn = b.checkIn.getTime() - now.getTime();
    const hBeforeCheckIn = msToCheckIn / (3600 * 1000);
    if (hBeforeCheckIn > 22 && hBeforeCheckIn <= 26 && b.status === "CONFIRMED") {
      attempted += 2;
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "pre_checkin" });
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "host_checklist_pre" });
    }

    const msAfterCheckIn = now.getTime() - b.checkIn.getTime();
    if (msAfterCheckIn >= 0 && msAfterCheckIn <= 3 * 3600 * 1000 && b.status === "CONFIRMED") {
      attempted += 1;
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "checkin" });
    }

    const msToCheckout = b.checkOut.getTime() - now.getTime();
    if (msToCheckout >= 0 && msToCheckout <= 2 * 3600 * 1000 && b.status === "CONFIRMED") {
      attempted += 1;
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "checkout" });
    }

    const msAfterOut = now.getTime() - b.checkOut.getTime();
    if (msAfterOut >= 2 * 3600 * 1000 && msAfterOut <= 6 * 3600 * 1000) {
      attempted += 1;
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "post_checkout" });
    }
    if (msAfterOut >= 8 * 3600 * 1000 && msAfterOut <= 36 * 3600 * 1000 && b.status === "COMPLETED") {
      attempted += 1;
      await runHostLifecycleMessage({ bookingId: b.id, trigger: "host_checklist_post" });
    }
  }

  return { processed: bookings.length, attempted };
}
