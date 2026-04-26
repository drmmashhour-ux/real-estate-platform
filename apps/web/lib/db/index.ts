/**
 * Order 81 — One entry for multi-client Prisma + `pg` `Pool` (raw SQL).
 * Use `@/lib/db` (this barrel via `lib/db.ts`) for imports. Clients are the package singletons
 * (`@repo/db-core` / `@repo/db-marketplace` / …), not re-instantiated here.
 */
import { Pool } from "pg";
import { coreDB } from "@repo/db-core";
import { prisma as marketplaceClient } from "@repo/db-marketplace";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export { coreDB };

/** @repo/db-marketplace — same instance as `listingsDB` and `marketplacePrisma`. */
export const marketplaceDB = marketplaceClient;

export { marketplaceClient as listingsDB, marketplaceClient as marketplacePrisma };

export { prisma as authPrisma } from "@repo/db-auth";
export { getLegacyDB } from "./legacy";
export const bnhubDB = getLegacyDB();
export const complianceDB = getLegacyDB();
export const monolithPrisma = getLegacyDB();
export { prisma as miniCorePrisma } from "@repo/db-core";

export { assertMarketplace } from "./domain-db";
export { MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE } from "./hybrid-strategy";
