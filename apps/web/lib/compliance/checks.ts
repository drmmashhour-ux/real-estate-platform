import { complianceDB } from "@/lib/db";

import { getDSCache, setDSCache, type DsGateCacheValue } from "./cache";

export type ListingOaciqValidation = DsGateCacheValue;

/**
 * OACIQ seller declaration gate: returns structured result (used by go-live, caching, and auditable paths).
 * Short-circuits on a fresh 60s in-process cache.
 */
export async function validateListingGate(
  listingId: string
): Promise<ListingOaciqValidation> {
  const cached = getDSCache(listingId);
  if (cached) {
    return cached;
  }

  const result = await runOaciqDsQuery(listingId);
  setDSCache(listingId, result);
  return result;
}

async function runOaciqDsQuery(listingId: string): Promise<ListingOaciqValidation> {
  const ds = await complianceDB.lecipmCrmOaciqSellerDeclaration.findFirst({
    where: { listingId },
  });

  if (!ds) {
    return { ok: false, message: "Seller Declaration (DS) required" };
  }
  if (ds.refused) {
    return { ok: false, message: "Seller Declaration refused — resolve before go-live" };
  }
  if (!ds.completed) {
    return { ok: false, message: "Seller Declaration incomplete" };
  }
  return { ok: true };
}

/**
 * OACIQ seller declaration gate for CRM `Listing` — throws on failure (legacy callers, autonomous agent).
 * `listingId` must be the monolith `Listing.id` (not `ShortTermListing` / marketplace shard ids).
 */
export async function validateListing(listingId: string): Promise<void> {
  const r = await validateListingGate(listingId);
  if (!r.ok) {
    throw new Error(r.message);
  }
}
