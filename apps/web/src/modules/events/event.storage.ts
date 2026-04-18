import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import type { GrowthEventPayload } from "./event.types";

export async function persistGrowthSignalEvent(e: GrowthEventPayload): Promise<{ id: string }> {
  const row = await prisma.growthSignalEvent.create({
    data: {
      eventName: e.name,
      userId: e.userId ?? null,
      sessionId: e.sessionId ?? null,
      entityType: e.entityType ?? null,
      entityId: e.entityId ?? null,
      payloadJson: asInputJsonValue(e.payload ?? {}),
    },
  });
  return { id: row.id };
}
