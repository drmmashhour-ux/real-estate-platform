/**
 * Prisma clients wrapped with {@link withTracing} for safe use in {@link ./db-safe.ts}
 * without importing the full `lib/db/index.ts` (avoids circular deps with `db-safe` → `index` → `db-safe`).
 */
import { coreDB } from "@repo/db-core";

import { withTracing } from "../db-extend";
import { getLegacyDB } from "./legacy";

export const monolithClient = getLegacyDB();

export const tracedCoreDB = withTracing(coreDB, "coreDB");
export const tracedMonolithDB = withTracing(monolithClient, "monolith");
