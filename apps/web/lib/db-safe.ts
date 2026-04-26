import type { QueryResult } from "pg";
import { prisma as oldDB } from "@repo/db";
import { coreDB } from "@repo/db-core";

import { pool } from "./db/index";
import { USE_NEW_DB } from "./db-switch";

type MonolithClient = typeof oldDB;

const QUERY_TIMEOUT_MS = 5000;

/**
 * Migration guard: when `USE_NEW_DB=1`, run the callback on `@repo/db-core` first, then
 * fall back to the monolith `@repo/db` on any error. When the flag is off, only the
 * monolith client is used.
 *
 * Renamed from `safeQuery` to avoid clashing with raw SQL {@link safeQuery} (Orders 75–76).
 */
export async function prismaWithCoreFallback<T>(fn: (db: MonolithClient) => Promise<T>): Promise<T> {
  if (!USE_NEW_DB) {
    return fn(oldDB);
  }
  try {
    return await fn(coreDB as unknown as MonolithClient);
  } catch (e) {
    console.warn("[DB FALLBACK]", e);
    return fn(oldDB);
  }
}

/**
 * Order 74 — retry transient `pg` failures (Neon, Supabase, network blips).
 * Retries the same text/params up to `retries` additional attempts after the first failure.
 */
export async function queryWithRetry(
  text: string,
  params?: unknown[],
  retries = 2
): Promise<QueryResult<Record<string, unknown>>> {
  try {
    return params === undefined
      ? await pool.query<Record<string, unknown>>(text)
      : await pool.query<Record<string, unknown>>(text, params);
  } catch (err) {
    if (retries > 0) {
      return queryWithRetry(text, params, retries - 1);
    }
    throw err;
  }
}

/**
 * Structured logging for ad-hoc raw SQL (duration + row count; no timeout — prefer {@link safeQuery} in routes).
 * Previously in `lib/db-direct.ts` (Order 82 — unified under `lib/db` + this module).
 */
export async function loggedQuery(
  text: string,
  params?: unknown[]
): Promise<QueryResult<Record<string, unknown>>> {
  const start = Date.now();
  try {
    const res =
      params === undefined
        ? await pool.query<Record<string, unknown>>(text)
        : await pool.query<Record<string, unknown>>(text, params);
    console.log("[DB QUERY]", {
      text,
      duration: Date.now() - start,
      rows: res.rowCount,
    });
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DB ERROR]", { text, error: message });
    throw err;
  }
}

/**
 * Order 76 — raw SQL with a 5s ceiling so handlers do not block indefinitely
 * (for logging without the timeout, use {@link loggedQuery}).
 */
export async function safeQuery(
  text: string,
  params?: unknown[]
): Promise<QueryResult<Record<string, unknown>>> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("DB_TIMEOUT")), QUERY_TIMEOUT_MS);
  });
  const pending =
    params === undefined
      ? pool.query<Record<string, unknown>>(text)
      : pool.query<Record<string, unknown>>(text, params);
  return Promise.race([pending, timeout]);
}
