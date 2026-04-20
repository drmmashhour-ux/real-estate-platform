/**
 * Centris syndication orchestration — connector-only.
 * Does NOT scrape Centris or duplicate board-protected MLS fields without authorization.
 */

import type { PrismaClient } from "@prisma/client";

import { centrisLog } from "./log";

export const CENTRIS_PLATFORM = "CENTRIS";

export type CentrisSyncOutcome =
  | { ok: true; externalId?: string | null }
  | { ok: false; code: string; message?: string };

/**
 * Placeholder for an authorized integration (broker board API, approved push partner, etc.).
 * Returns pending until a real connector sets SYNCED + externalId via listing-sync.
 */
export async function requestCentrisPublishPlaceholder(_args: {
  prisma: PrismaClient;
  listingId: string;
}): Promise<CentrisSyncOutcome> {
  centrisLog("publish_requested_placeholder", {
    listingId: _args.listingId,
    note: "Awaiting authorized Centris connector — row stays PENDING until webhook/batch confirms.",
  });
  return { ok: true, externalId: null };
}
