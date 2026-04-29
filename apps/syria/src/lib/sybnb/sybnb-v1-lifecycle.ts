import { prisma } from "@/lib/db";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";
import { adjustTrustScore } from "@/lib/sybnb/trust-score";

function utcStartOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * SYBNB-5: after the stay (calendar day of “today” in UTC is strictly after the calendar `checkOut` day),
 * mark eligible bookings as `completed`. Eligible: locked-in stays (`confirmed` or `paid`).
 */
export async function autoCompleteDueSybnbBookings(now: Date = new Date()): Promise<{ updated: number; ids: string[] }> {
  const todayStart = utcStartOfDay(now);
  const due = await prisma.sybnbBooking.findMany({
    where: {
      status: { in: ["confirmed", "paid"] },
    },
    select: { id: true, checkOut: true },
  });
  const ids: string[] = [];
  for (const row of due) {
    if (todayStart > utcStartOfDay(row.checkOut)) {
      ids.push(row.id);
    }
  }
  if (ids.length === 0) {
    return { updated: 0, ids: [] };
  }
  const res = await prisma.sybnbBooking.updateMany({
    where: { id: { in: ids } },
    data: { status: "completed", version: { increment: 1 } },
  });
  const parties = await prisma.sybnbBooking.findMany({
    where: { id: { in: ids } },
    select: { guestId: true, hostId: true },
  });
  for (const row of parties) {
    void adjustTrustScore(row.guestId, 10);
    void adjustTrustScore(row.hostId, 10);
  }
  await Promise.all([...new Set(parties.map((h) => h.hostId))].map((hid) => recomputeReputationScoreForUser(hid)));
  return { updated: res.count, ids };
}
