import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BookingAuditActorType = "guest" | "host" | "admin" | "system" | "stripe_webhook";

/**
 * Append a row to `BnhubBookingEvent` (immutable audit stream).
 */
export async function appendBookingAuditLog(params: {
  bookingId: string;
  eventType: string;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.bnhubBookingEvent.create({
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      actorId: params.actorId?.trim() || null,
      payload: (params.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
