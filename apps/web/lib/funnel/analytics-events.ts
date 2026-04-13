import type { AnalyticsFunnelEventName, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";

export type RecordAnalyticsFunnelEventInput = {
  name: AnalyticsFunnelEventName;
  listingId?: string | null;
  userId?: string | null;
  source?: string | null;
  sessionId?: string | null;
  variant?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Persists a row in `analytics_events` for funnel / retargeting / A-B dashboards.
 * Never throws to callers.
 */
export async function recordAnalyticsFunnelEvent(input: RecordAnalyticsFunnelEventInput): Promise<void> {
  try {
    await prisma.analyticsFunnelEvent.create({
      data: {
        name: input.name,
        listingId: input.listingId?.trim() || null,
        userId: input.userId?.trim() || null,
        source: input.source?.trim().slice(0, 128) || null,
        sessionId: input.sessionId?.trim().slice(0, 64) || null,
        variant: input.variant?.trim().slice(0, 32) || null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    logError("recordAnalyticsFunnelEvent failed", e);
  }
}
