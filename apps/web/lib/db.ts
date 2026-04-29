import "./db-entry-guard";
import "server-only";

if (typeof window !== "undefined") {
  throw new Error("❌ DB imported in client bundle");
}

import { getLegacyDB } from "@/lib/db/legacy";
import { coreDB } from "@repo/db-core";
import { USE_NEW_DB } from "./db-switch";

const oldDB = getLegacyDB();

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
  getPoolStats,
  coreDB,
  tracedCoreDB,
  tracedMonolithDB,
  monolithClient,
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
  // Order 81.1
  query,
  readOnlyQuery,
  ReadOnlyQueryError,
  runTx,
  extractLeadingSqlCommentTag,
  classifySqlStatementKind,
  safeQuery,
  safePooledQuery,
  loggedQuery,
  queryWithRetry,
  getDbResilienceMetrics,
  getDbResilienceState,
  isDbCircuitOpen,
  isDatabaseDegraded,
  setPoolProbeResult,
  DB_ERROR_CODES,
  DbTimeoutError,
  DbUnavailableError,
} from "./db/index";
export { getListingsDB } from "./db/routeSwitch";
export type { ListingsDbClient } from "./db/routeSwitch";
export { assertSafeUsage } from "./db/assert";
