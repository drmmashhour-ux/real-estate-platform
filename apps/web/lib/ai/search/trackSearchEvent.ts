import { SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emitPlatformAutonomyEvent } from "@/lib/autonomy/emit-platform-event";

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

  if (eventType === "VIEW" && userId) {
    void (async () => {
      try {
        const prof = await prisma.userSearchProfile.findUnique({
          where: { userId },
          select: { updatedAt: true },
        });
        if (prof && Date.now() - prof.updatedAt.getTime() < 3600000) return;
        const { buildUserSearchProfileFromEvents } = await import("./buildUserProfile");
        await buildUserSearchProfileFromEvents(userId);
      } catch {
        /* non-fatal */
      }
    })();
  }

  void (async () => {
    try {
      if (eventType === SearchEventType.BOOK && listingId) {
        const bookingId = metadata && typeof metadata.bookingId === "string" ? metadata.bookingId : undefined;
        await emitPlatformAutonomyEvent({
          eventType: "BOOKING_CREATED",
          entityType: "booking",
          entityId: bookingId ?? listingId,
          userId,
          payload: { listingId, bookingId },
        });
      } else if (eventType === SearchEventType.VIEW && userId && listingId && Math.random() < 0.04) {
        const hourBucket = new Date().toISOString().slice(0, 13);
        await emitPlatformAutonomyEvent({
          eventType: "USER_ACTIVITY",
          entityType: "short_term_listing",
          entityId: listingId,
          userId,
          dedupeKey: `ua:${userId}:${hourBucket}`,
          payload: { listingId, kind: "view_sample" },
        });
      }
    } catch {
      /* non-fatal */
    }
  })();
}
