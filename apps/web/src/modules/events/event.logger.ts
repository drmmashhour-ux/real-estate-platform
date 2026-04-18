import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { redactForLog } from "@/lib/security/redact";
import type { LogIntelligenceEventInput } from "./event.types";

/**
 * Persist a product intelligence event (never throws to callers).
 */
export async function logIntelligenceEvent(input: LogIntelligenceEventInput): Promise<string | null> {
  try {
    const row = await prisma.platformIntelligenceEvent.create({
      data: {
        type: input.type.slice(0, 80),
        userId: input.userId?.trim() || null,
        listingId: input.listingId?.trim() || null,
        payload: (input.payload ?? {}) as object,
      },
    });
    logInfo("[intel-event]", { type: input.type, id: row.id });
    return row.id;
  } catch (e) {
    console.error("[intel-event] persist failed", redactForLog(e));
    return null;
  }
}
