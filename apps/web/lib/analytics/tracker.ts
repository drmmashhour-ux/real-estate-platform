import { randomUUID } from "node:crypto";

import { query } from "@/lib/sql";

/**
 * Append-only event log for AI + analytics (`marketplace_events`).
 * Keep payloads small and non-PII unless you have a data contract.
 */
export async function trackEvent(event: string, data: Record<string, unknown>): Promise<void> {
  const id = randomUUID();
  await query(
    `
    INSERT INTO "marketplace_events" ("id", "event", "data", "created_at")
    VALUES ($1, $2, $3::jsonb, NOW())
  `,
    [id, event, JSON.stringify(data ?? {})]
  );
}
