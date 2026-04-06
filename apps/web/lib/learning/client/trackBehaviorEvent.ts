import type { BehaviorEventType } from "@prisma/client";

/**
 * Fire-and-forget behavior signal for ranking learning. Uses same-origin cookies
 * (`lecipm_behavior_sid`) so the server can stitch guest sessions.
 */
export function trackBehaviorEvent(payload: {
  eventType: BehaviorEventType;
  pageType: string;
  listingId?: string;
  city?: string | null;
  category?: string | null;
  propertyType?: string | null;
  priceCents?: number | null;
  aiScoreSnapshot?: number | null;
  metadata?: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;
  fetch("/api/behavior/event", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: payload.eventType,
      pageType: payload.pageType.slice(0, 64),
      ...(payload.listingId ? { listingId: payload.listingId } : {}),
      ...(payload.city != null && payload.city !== "" ? { city: payload.city } : {}),
      ...(payload.category != null && payload.category !== "" ? { category: payload.category } : {}),
      ...(payload.propertyType != null && payload.propertyType !== ""
        ? { propertyType: payload.propertyType }
        : {}),
      ...(payload.priceCents != null && Number.isFinite(payload.priceCents)
        ? { priceCents: Math.round(payload.priceCents) }
        : {}),
      ...(payload.aiScoreSnapshot != null && Number.isFinite(payload.aiScoreSnapshot)
        ? { aiScoreSnapshot: payload.aiScoreSnapshot }
        : {}),
      ...(payload.metadata ? { metadata: payload.metadata } : {}),
    }),
  }).catch(() => {});
}
