import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const AUDIT_EVENT = "growth_engine_v1:audit";

export async function logGrowthEngineAudit(input: {
  actorUserId?: string | null;
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.growthFunnelEvent.create({
      data: {
        eventName: AUDIT_EVENT,
        userId: input.actorUserId?.trim() || undefined,
        properties: {
          action: input.action,
          ...(input.payload ?? {}),
          at: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  } catch {
    /* non-blocking */
  }
}
