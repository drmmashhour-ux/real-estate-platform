import { resolveShortTermListingRef } from "@/lib/listing-code";

/** Stable internal id + immutable public listing code for CRM / leads. */
export type BnhubLeadListingSnapshot = { listingId: string; listingCode: string };

/**
 * Resolve a BNHUB listing ref (UUID or `LEC-#####`) for Lead denormalization.
 * Ensures `listingId` is always the canonical row id and `listingCode` matches DB.
 */
export async function snapshotBnhubListingForLead(
  ref: string | null | undefined
): Promise<BnhubLeadListingSnapshot | null> {
  if (ref == null || !String(ref).trim()) return null;
  const resolved = await resolveShortTermListingRef(String(ref).trim());
  if (!resolved) return null;
  return { listingId: resolved.id, listingCode: resolved.listingCode };
}
