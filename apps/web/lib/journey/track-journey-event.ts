import type { AnalyticsFunnelEventName } from "@prisma/client";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";

export type TrackJourneyEventInput = {
  name: AnalyticsFunnelEventName;
  listingId?: string | null;
  userId?: string | null;
  source?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Server-safe funnel step — extends `recordAnalyticsFunnelEvent` with consistent BNHub metadata.
 */
export async function trackJourneyEvent(input: TrackJourneyEventInput): Promise<void> {
  const meta = {
    ...(input.metadata ?? {}),
    journey: "bnhub",
  };
  await recordAnalyticsFunnelEvent({
    name: input.name,
    listingId: input.listingId,
    userId: input.userId,
    source: input.source,
    sessionId: input.sessionId,
    metadata: meta,
  });
}
