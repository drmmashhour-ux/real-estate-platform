/**
 * Order 81 / 81.1 — **Single entry** for Prisma clients, `pg` pool, and typed SQL (`query` / `readOnlyQuery`).
 * The process-wide `pg.Pool` is created only in {@link ./pool-core.ts} (not here).
 * App code should import from `@/lib/db` (barrel in `../db.ts`); do not use `@/lib/db-safe` or `@/lib/db-direct` in app modules.
 */
import type { Prisma } from "@prisma/client";
import { coreDB } from "@repo/db-core";
import { prisma as marketplaceClient } from "@repo/db-listings";

import { monolithClient } from "./traced-clients";

// This file is the ONLY barrel that re-exports pool + Prisma; the Pool singleton lives in ./pool-core.ts
export { pool, getPoolStats } from "./pool-core";

export { coreDB };

/** @repo/db-listings — same instance as `listingsDB` and `marketplacePrisma`. */
export const marketplaceDB = marketplaceClient;

export { marketplaceClient as listingsDB, marketplaceClient as marketplacePrisma };

export { prisma as authPrisma } from "@repo/db-auth";
export { getLegacyDB } from "./legacy";

export const bnhubDB = monolithClient;
export const complianceDB = monolithClient;
export const monolithPrisma = monolithClient;

export { tracedCoreDB, tracedMonolithDB, monolithClient } from "./traced-clients";

export { prisma as miniCorePrisma } from "@repo/db-core";

export { assertMarketplace } from "./domain-db";
export { MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE } from "./hybrid-strategy";

export {
  query,
  readOnlyQuery,
  ReadOnlyQueryError,
  extractLeadingSqlCommentTag,
  classifySqlStatementKind,
} from "./sql-query";

/**
 * Run interactive transactions on the marketplace (listings) Prisma client — prefer this over
 * ad-hoc `marketplaceDB.$transaction` for consistent semantics.
 */
export function runTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return marketplaceDB.$transaction(fn);
}

export {
  DB_ERROR_CODES,
  DbTimeoutError,
  DbUnavailableError,
  __resetDbResilienceStateForTests,
  getDbResilienceMetrics,
  getDbResilienceState,
  hashQueryText,
  isDatabaseDegraded,
  isDbCircuitOpen,
  isTransientPooledError,
  loggedQuery,
  prismaWithCoreFallback,
  queryWithRetry,
  safePooledQuery,
  safeQuery,
  setPoolProbeResult,
} from "./db-safe";
