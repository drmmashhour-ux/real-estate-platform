/**
 * Client tracking transport + payload helpers. Server persistence uses `recordGrowthEvent` in API routes.
 * Single ingest endpoint keeps dedupe + attribution centralized.
 */

import { getTrackingSessionId } from "../tracking";
import type { ClientTrackingPayload, TrackingMetadata } from "./tracking-types";

export const CLIENT_TRACKING_INGEST_URL = "/api/analytics/track" as const;

export function buildClientTrackingBody(input: {
  eventType: string;
  path?: string | null;
  meta?: TrackingMetadata | null;
  sessionId?: string | null;
}): Record<string, unknown> {
  const sessionId = input.sessionId ?? getTrackingSessionId();
  return {
    eventType: input.eventType,
    path: input.path?.slice(0, 2048) ?? null,
    sessionId,
    meta: input.meta ?? undefined,
  };
}

/**
 * Fire-and-forget POST to ingest (same contract as `track()` in `lib/tracking.ts`).
 * Prefer `trackEvent` / `track()` for normal use — this is for advanced callers.
 */
export function sendClientTrackingBeacon(payload: ClientTrackingPayload & { eventType: string }): void {
  if (typeof window === "undefined") return;
  const path =
    payload.path ?? `${window.location.pathname}${window.location.search}`.slice(0, 2048);
  const body = JSON.stringify(
    buildClientTrackingBody({
      eventType: payload.eventType,
      path,
      meta: {
        ...payload.metadata,
        ...(payload.timestamp ? { clientTimestamp: payload.timestamp } : {}),
      },
      sessionId: payload.sessionId ?? undefined,
    })
  );
  try {
    void fetch(CLIENT_TRACKING_INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
