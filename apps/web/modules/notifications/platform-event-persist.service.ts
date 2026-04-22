import { prisma } from "@/lib/db";

import type { PlatformBusinessEvent } from "./platform-events";

/** Inserts into `platform_events` for auditing and downstream workers. */
export async function persistBusinessPlatformEvent(event: PlatformBusinessEvent): Promise<void> {
  const ref =
    "reference" in event && typeof (event as { reference?: string }).reference === "string"
      ? (event as { reference: string }).reference
      : null;

  await prisma.platformEvent.create({
    data: {
      eventType: event.type,
      sourceModule: "business_notification",
      entityType: "BUSINESS_EVENT",
      entityId: ref?.slice(0, 120) ?? undefined,
      payload: event as object,
      processingStatus: "processed",
      processedAt: new Date(),
    },
  });
}
