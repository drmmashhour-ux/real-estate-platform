import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { MarketplaceMemoryEntityType, MarketplaceMemoryEventType } from "@prisma/client";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";

export type CaptureMemoryEventInput = {
  userId: string;
  eventType: MarketplaceMemoryEventType;
  entityType: MarketplaceMemoryEntityType;
  entityId: string;
  metadataJson?: Record<string, unknown> | null;
};

async function ensureProfile(userId: string) {
  await prisma.userMemoryProfile.upsert({
    where: { userId },
    create: {
      userId,
    },
    update: {},
  });
}

/**
 * Append-only behavior event. Respects personalization opt-out (no writes when disabled).
 */
export async function captureMemoryEvent(
  input: CaptureMemoryEventInput,
): Promise<{ ok: boolean; reason?: string; eventId?: string }> {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return { ok: false, reason: "feature_disabled" };
  }

  await ensureProfile(input.userId);
  const profile = await prisma.userMemoryProfile.findUniqueOrThrow({ where: { userId: input.userId } });
  if (!profile.personalizationEnabled) {
    return { ok: false, reason: "personalization_disabled" };
  }

  const row = await prisma.userMemoryEvent.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId.slice(0, 64),
      metadataJson: input.metadataJson ?? undefined,
    },
  });

  void logMemoryAudit({
    userId: input.userId,
    actionType: "event_captured",
    summary: `Memory event ${input.eventType} on ${input.entityType}:${input.entityId}`,
    details: { eventId: row.id, eventType: input.eventType },
  }).catch(() => null);

  return { ok: true, eventId: row.id };
}
