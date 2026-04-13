import type { PlatformAutonomyEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

export type EmitPlatformEventInput = {
  eventType: PlatformAutonomyEventType;
  entityType?: string;
  entityId?: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
  /** When set, duplicate emissions with the same key are ignored. */
  dedupeKey?: string;
};

/**
 * Append-only platform event (LECIPM + BNHub). Processed asynchronously by the autonomy cron / dispatcher.
 */
export async function emitPlatformAutonomyEvent(input: EmitPlatformEventInput): Promise<string | null> {
  try {
    if (input.dedupeKey) {
      const existing = await prisma.platformAutonomyEvent.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return null;
    }

    const row = await prisma.platformAutonomyEvent.create({
      data: {
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId ?? undefined,
        payload: input.payload ? (input.payload as object) : undefined,
        dedupeKey: input.dedupeKey,
      },
    });
    return row.id;
  } catch {
    return null;
  }
}
