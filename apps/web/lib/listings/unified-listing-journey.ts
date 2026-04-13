/**
 * One platform pattern for “first listing vs next listings” across channels.
 *
 * **First listing** — full wizard: every step, verification, declarations, and publish checks.
 * **Next listings** — same engine, but you can start from a previous listing (`?from=<id>`) so fields
 * are prefilled; you edit what changed and use **Save** / **Continue** (or **Save & continue** on BNHUB host).
 *
 * | Channel | Create URL | Clone query |
 * |---------|------------|-------------|
 * | FSBO / sell by yourself | `/dashboard/seller/create` | `?from=<fsboListingId>` |
 * | BNHUB host (short-term) | `/host/listings/new` | `?from=<shortTermListingId>` |
 * | Broker CRM | Workspace listings come from tenant CRM seeds/tools — not the same Prisma model as FSBO/BNHUB. |
 */

export const UNIFIED_LISTING_JOURNEY = {
  fsboCreatePath: "/dashboard/seller/create",
  fsboListPath: "/dashboard/seller/listings",
  bnhubHostNewPath: "/host/listings/new",
  bnhubHostListPath: "/host/listings",
} as const;

/** Append `?from=` when the user already has at least one listing (same pattern as BNHUB host grid). */
export function fsboCreateHrefWithOptionalTemplate(mostRecentListingId: string | undefined): string {
  if (!mostRecentListingId?.trim()) return UNIFIED_LISTING_JOURNEY.fsboCreatePath;
  return `${UNIFIED_LISTING_JOURNEY.fsboCreatePath}?from=${encodeURIComponent(mostRecentListingId.trim())}`;
}

export function bnhubNewHrefWithOptionalTemplate(mostRecentListingId: string | undefined): string {
  if (!mostRecentListingId?.trim()) return UNIFIED_LISTING_JOURNEY.bnhubHostNewPath;
  return `${UNIFIED_LISTING_JOURNEY.bnhubHostNewPath}?from=${encodeURIComponent(mostRecentListingId.trim())}`;
}
