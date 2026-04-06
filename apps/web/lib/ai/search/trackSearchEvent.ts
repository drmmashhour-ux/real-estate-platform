import { SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

export type TrackSearchEventInput = {
  eventType: SearchEventType;
  userId?: string | null;
  listingId?: string | null;
  metadata?: Record<string, unknown>;
};

async function refreshConversionRate(listingId: string): Promise<void> {
  const m = await prisma.listingSearchMetrics.findUnique({ where: { listingId } });
  if (!m || m.views7d <= 0) return;
  const conv = Math.min(1, (m.bookings7d ?? 0) / m.views7d);
  await prisma.listingSearchMetrics
    .update({
      where: { listingId },
      data: { conversionRate: conv },
    })
    .catch(() => {});
}

/**
 * Persist search analytics event and lightly update `ListingSearchMetrics` when applicable.
 */
export async function trackSearchEvent(input: TrackSearchEventInput): Promise<void> {
  const { eventType, userId, listingId, metadata } = input;
  try {
    await prisma.searchEvent.create({
      data: {
        eventType,
        userId: userId ?? undefined,
        listingId: listingId ?? undefined,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch {
    return;
  }

  if (!listingId) return;

  try {
    if (eventType === "VIEW") {
      await prisma.listingSearchMetrics.upsert({
        where: { listingId },
        create: { listingId, views7d: 1, views30d: 1 },
        update: { views7d: { increment: 1 }, views30d: { increment: 1 } },
      });
      await refreshConversionRate(listingId);
    } else if (eventType === "CLICK") {
      const existing = await prisma.listingSearchMetrics.findUnique({ where: { listingId } });
      const nextCtr = Math.min(0.92, (existing?.ctr ?? 0.08) + 0.028);
      await prisma.listingSearchMetrics.upsert({
        where: { listingId },
        create: { listingId, ctr: nextCtr },
        update: { ctr: nextCtr },
      });
    } else if (eventType === "BOOK") {
      await prisma.listingSearchMetrics.upsert({
        where: { listingId },
        create: { listingId, bookings7d: 1, bookings30d: 1 },
        update: { bookings7d: { increment: 1 }, bookings30d: { increment: 1 } },
      });
      await refreshConversionRate(listingId);
    }
  } catch {
    /* non-fatal */
  }
}
