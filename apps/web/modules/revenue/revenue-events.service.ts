/**
 * Log-only revenue funnel events (V1 — no DB writes). Use alongside PlatformPayment / webhooks.
 */

import { logInfo } from "@/lib/logger";
import {
  isRevenueDashboardV1Enabled,
  isRevenueEnforcementV1Enabled,
} from "@/modules/revenue/revenue-enforcement-flags";
import { recordRevenueMonitoringEvent } from "@/modules/revenue/revenue-monitoring.service";
import type { RevenueEventType } from "@/modules/revenue/revenue-events.types";

export type { RevenueEventType } from "@/modules/revenue/revenue-events.types";

export type TrackRevenueEventInput = {
  type: RevenueEventType;
  userId?: string | null;
  listingId?: string | null;
  leadId?: string | null;
  metadata?: Record<string, unknown>;
};

function baseMeta(source: string): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    source,
  };
}

/**
 * Logs structured revenue events and updates in-memory monitoring when enforcement V1 is enabled.
 * Safe to call when enforcement is off (still logs at info for audit trails if desired — currently skips monitoring when off).
 */
export function trackRevenueEvent(input: TrackRevenueEventInput): void {
  const source =
    typeof input.metadata?.source === "string" ? String(input.metadata.source) : "unknown";
  const merged = {
    ...baseMeta(source),
    ...input.metadata,
    type: input.type,
    userId: input.userId ?? undefined,
    listingId: input.listingId ?? undefined,
    leadId: input.leadId ?? undefined,
  };

  logInfo("[revenue]", merged);

  if (!isRevenueEnforcementV1Enabled() && !isRevenueDashboardV1Enabled()) return;

  if (input.type === "lead_viewed" && input.metadata?.ctaIntent === true) {
    return;
  }

  recordRevenueMonitoringEvent(input.type);
}
