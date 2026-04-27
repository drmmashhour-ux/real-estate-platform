import { listingsDB, bnhubDB } from "./index";

export type ListingsDbClient = typeof listingsDB;

/**
 * Route-level Prisma for migrated `listings` / `bookings` paths (Order 107).
 *
 * - **Default:** `@repo/db-listings` via `listingsDB` (same as direct imports before the switch).
 * - **`USE_LISTINGS_MONOLITH=1`:** `bnhubDB` (monolith `@repo/db`) for emergency rollback; ensure your schema matches.
 *
 * Global `USE_NEW_DB` in `lib/db` is separate: keep it `0` in prod to avoid most `prisma` call sites
 * breaking; this helper still returns the marketplace client unless you set `USE_LISTINGS_MONOLITH=1`.
 */
export function getListingsDB(): ListingsDbClient {
  if (process.env.USE_LISTINGS_MONOLITH === "1") {
    return bnhubDB as unknown as ListingsDbClient;
  }
  return listingsDB;
}
