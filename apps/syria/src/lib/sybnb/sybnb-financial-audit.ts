import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sybnbConfig } from "@/config/sybnb.config";

/**
 * Append-only audit for SYBNB money-moving events (no updates/deletes in application code).
 */
export async function appendSyriaSybnbCoreAudit(input: {
  bookingId: string | null;
  event: string;
  metadata?: Prisma.JsonObject;
}): Promise<void> {
  await prisma.syriaSybnbCoreAudit.create({
    data: {
      bookingId: input.bookingId,
      event: input.event,
      provider: sybnbConfig.provider,
      metadata: (input.metadata ?? { source: "server" }) as Prisma.InputJsonValue,
    },
  });
}
