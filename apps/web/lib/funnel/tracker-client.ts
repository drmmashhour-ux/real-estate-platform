"use client";

import { track } from "@/lib/tracking";

/** Client-only funnel beacon (never imports Prisma / `server-only`). */
export function trackFunnelEvent(name: string, data?: Record<string, unknown>): void {
  track("conversion_track", {
    meta: { funnelEvent: name, ...(data ?? {}) },
  });
}
