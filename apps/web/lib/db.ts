import { prisma as oldDB } from "@repo/db";
import { coreDB } from "@repo/db-core";
import { USE_NEW_DB } from "./db-switch";

/**
 * Rollout switch: `USE_NEW_DB=1` → `@repo/db-core` (small schema). Default → `@repo/db` monolith.
 * Typed as monolith client; with the flag on, only operations supported by `db-core` are safe.
 */
export const db = USE_NEW_DB ? (coreDB as unknown as typeof oldDB) : oldDB;

/** Most call sites use this name — same instance as `db`. */
export const prisma = db;

export { USE_NEW_DB, USE_MARKETPLACE_DB } from "./db-switch";

export {
  pool,
  coreDB,
  marketplaceDB,
  assertMarketplace,
  MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE,
  authPrisma,
  listingsDB,
  bnhubDB,
  complianceDB,
  monolithPrisma,
  marketplacePrisma,
  miniCorePrisma,
} from "./db/index";
