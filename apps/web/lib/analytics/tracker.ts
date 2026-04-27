import { randomUUID } from "node:crypto";

import { query } from "@/lib/sql";

/**
 * Append-only event log for AI + demand analytics (`marketplace_events`).
 * Standard event names: `listing_view`, `booking_created` (see `eventTracker` dual-write).
 * Keep payloads small and non-PII unless you have a data contract.
 */
export async function writeMarketplaceEvent(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const id = randomUUID();
  await query(
    `
    INSERT INTO "marketplace_events" ("id", "event", "data", "created_at")
    VALUES ($1, $2, $3::jsonb, NOW())
  `,
    [id, event, JSON.stringify(data ?? {})]
  );
}

/** @deprecated Use `writeMarketplaceEvent` — kept for a few internal call sites. */
export const trackEvent = writeMarketplaceEvent;
