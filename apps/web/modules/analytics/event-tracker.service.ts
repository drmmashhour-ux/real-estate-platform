/**
 * Structured event emission — uses platform observability (no PII in `payload`).
 */
import { recordPlatformEvent } from "@/lib/observability";

export async function trackInfrastructureEvent(input: {
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordPlatformEvent({
    eventType: input.eventType,
    sourceModule: "infrastructure",
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
  });
}
