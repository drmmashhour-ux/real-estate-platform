import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { redactForLog } from "@/lib/security/redact";
import type { Prisma } from "@prisma/client";
import type { ProductEventName } from "./event.constants";
import { logIntelligenceEvent } from "./event.logger";

export type LogProductEventInput = {
  eventType: ProductEventName;
  userId?: string | null;
  sessionId?: string | null;
  listingId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  /** Sanitized client/server context — no raw PII */
  metadata?: Record<string, unknown>;
  /** Also emit legacy intelligence row (same pipeline as autopilot) */
  mirrorToIntelligence?: boolean;
};

function sanitizeMeta(meta: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  const m = { ...(meta ?? {}) };
  for (const k of Object.keys(m)) {
    const v = m[k];
    if (typeof v === "string" && v.length > 2000) m[k] = `${v.slice(0, 2000)}…`;
  }
  return m as Prisma.InputJsonValue;
}

/**
 * Primary analytics write — `EventLog` (never throws).
 */
export async function logProductEvent(input: LogProductEventInput): Promise<string | null> {
  try {
    const row = await prisma.eventLog.create({
      data: {
        eventType: input.eventType.slice(0, 80),
        userId: input.userId?.trim() || null,
        sessionId: input.sessionId?.trim().slice(0, 128) || null,
        listingId: input.listingId?.trim().slice(0, 64) || null,
        entityType: input.entityType?.trim().slice(0, 64) || null,
        entityId: input.entityId?.trim().slice(0, 64) || null,
        metadata: sanitizeMeta(input.metadata),
      },
    });
    logInfo("[event-log]", { type: input.eventType, id: row.id });
    if (input.mirrorToIntelligence) {
      void logIntelligenceEvent({
        type: input.eventType,
        userId: input.userId,
        listingId: input.listingId,
        payload: (input.metadata ?? {}) as Record<string, unknown>,
      });
    }
    return row.id;
  } catch (e) {
    console.error("[event-log] persist failed", redactForLog(e));
    return null;
  }
}
