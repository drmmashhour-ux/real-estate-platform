import { createHash } from "node:crypto";
import type { QueryResult } from "pg";
import * as Sentry from "@sentry/nextjs";
import { getLegacyDB } from "@/lib/db/legacy";

import { logFallback } from "./db-fallback-log";
import { pool } from "./db/pool-core";
import { tracedCoreDB, tracedMonolithDB } from "./db/traced-clients";
import { USE_NEW_DB } from "./db-switch";
import { traceSQL } from "./sql-trace";

const oldDB = getLegacyDB();

type MonolithClient = typeof oldDB;

const QUERY_TIMEOUT_MS = 5000;
const BASE_BACKOFF_MS = 100;

/** 5 consecutive transient failures → open 30s (Order 76.1) */
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 30_000;

// --- Circuit (module state) ---

let failureCount = 0;
let circuitOpenUntil = 0;

// --- Last pool probe (readiness) ---

let lastPoolProbeOk: boolean | null = null;
let lastPoolLatencyMs: number | null = null;

// --- Metrics (cumulative) ---

let metricsQueryCount = 0;
let metricsQueryDurationTotalMs = 0;
let metricsQueryFailures = 0;
let metricsTimeouts = 0;
let metricsCircuitOpenCount = 0;

export const DB_ERROR_CODES = {
  UNAVAILABLE: "DB_UNAVAILABLE",
  TIMEOUT: "DB_TIMEOUT",
} as const;

export class DbUnavailableError extends Error {
  readonly code = DB_ERROR_CODES.UNAVAILABLE;
  override name = "DbUnavailableError";
  constructor(message = "Database temporarily unavailable (circuit open or overload)") {
    super(message);
  }
}

export class DbTimeoutError extends Error {
  readonly code = DB_ERROR_CODES.TIMEOUT;
  override name = "DbTimeoutError";
  queryHash: string;
  durationMs: number;
  /** Same as durationMs; aligns with `throw { code, duration }` (Order 76.1). */
  get duration(): number {
    return this.durationMs;
  }
  constructor(queryHash: string, durationMs: number) {
    super(`query exceeded ${durationMs}ms (hash ${queryHash})`);
    this.queryHash = queryHash;
    this.durationMs = durationMs;
  }
}

/** Short hash for logs / Sentry (not reversible). */
export function hashQueryText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDbCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function getDbResilienceState(): {
  circuitOpen: boolean;
  circuitOpenUntil: number;
  failureCount: number;
  lastPoolOk: boolean | null;
  lastPoolLatencyMs: number | null;
} {
  return {
    circuitOpen: isDbCircuitOpen(),
    circuitOpenUntil,
    failureCount,
    lastPoolOk: lastPoolProbeOk,
    lastPoolLatencyMs,
  };
}

export function getDbResilienceMetrics(): {
  db_query_count: number;
  db_query_duration_ms_avg: number;
  db_query_failures: number;
  db_timeouts: number;
  circuit_open_count: number;
} {
  const avg = metricsQueryCount > 0 ? metricsQueryDurationTotalMs / metricsQueryCount : 0;
  return {
    db_query_count: metricsQueryCount,
    db_query_duration_ms_avg: Math.round(avg * 10) / 10,
    db_query_failures: metricsQueryFailures,
    db_timeouts: metricsTimeouts,
    circuit_open_count: metricsCircuitOpenCount,
  };
}

/**
 * @internal For tests / emergency reset only.
 */
export function __resetDbResilienceStateForTests(): void {
  failureCount = 0;
  circuitOpenUntil = 0;
  lastPoolProbeOk = null;
  lastPoolLatencyMs = null;
  metricsQueryCount = 0;
  metricsQueryDurationTotalMs = 0;
  metricsQueryFailures = 0;
  metricsTimeouts = 0;
  metricsCircuitOpenCount = 0;
}

export function setPoolProbeResult(ok: boolean, latencyMs: number | null): void {
  lastPoolProbeOk = ok;
  lastPoolLatencyMs = latencyMs;
}

/**
 * If circuit is open (cooling) or the last known pool check failed, skip heavy / optional DB work.
 * Does not throw — callers can branch to cache/fallbacks.
 */
export function isDatabaseDegraded(): boolean {
  if (isDbCircuitOpen()) return true;
  if (lastPoolProbeOk === false) return true;
  return false;
}

function ensureDbCircuitOrThrow(): void {
  if (isDbCircuitOpen()) {
    throw new DbUnavailableError();
  }
}

function onPooledQuerySuccess(durationMs: number, retries: number, queryType: string, queryHash: string): void {
  failureCount = 0;
  metricsQueryCount += 1;
  metricsQueryDurationTotalMs += durationMs;
  if (process.env.DB_QUERY_LOG === "0") return;
  console.log(
    JSON.stringify({
      event: "db_query",
      duration: durationMs,
      retries,
      success: true,
      queryType,
      queryHash,
    })
  );
}

function onPooledQueryFinalFailure(
  e: unknown,
  durationTotalMs: number,
  retries: number,
  queryType: string,
  queryHash: string,
  transient: boolean
): void {
  metricsQueryFailures += 1;
  console.log(
    JSON.stringify({
      event: "db_query",
      duration: durationTotalMs,
      retries,
      success: false,
      queryType,
      queryHash,
      transient,
    })
  );
  Sentry.captureException(e, {
    tags: { layer: "db", queryType: queryType || "raw" },
    extra: { retries, duration: durationTotalMs, queryHash, transient },
  });
  if (transient) {
    failureCount += 1;
    if (failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
      metricsCircuitOpenCount += 1;
      failureCount = 0;
    }
  }
}

/**
 * Heuristic: only retry when the driver / OS signals a blip, not for SQL/constraint errors.
 * @internal exported for unit tests
 */
export function isTransientPooledError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as NodeJS.ErrnoException & { code?: string };
  const code = err.code;
  if (typeof code === "string") {
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "EPIPE") {
      return true;
    }
    if (code === "EHOSTUNREACH" || code === "ENETUNREACH" || code === "ESOCKETTIMEDOUT") return true;
  }
  const msg = err instanceof Error ? err.message : String(e);
  if (
    /ECONNRESET|ETIMEDOUT|ECONNREFUSED|connection refused|socket|timeout/i.test(msg) &&
    !/syntax error|constraint|violates|invalid/i.test(msg)
  ) {
    return true;
  }
  return false;
}

/**
 * Order 76.1 — exponential backoff + jitter; transient errors only; circuit breaker; structured logs.
 * Retries: `retries` additional attempts after the first (default 2 → 3 attempts total).
 */
export async function queryWithRetry(
  text: string,
  params?: unknown[],
  retries = 2
): Promise<QueryResult<Record<string, unknown>>> {
  ensureDbCircuitOrThrow();
  const queryType = "raw";
  const queryHash = hashQueryText(text);
  const maxAttempts = retries + 1;
  const t0All = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    ensureDbCircuitOrThrow();
    const t0 = Date.now();
    try {
      const res =
        params === undefined
          ? await pool.query<Record<string, unknown>>(text)
          : await pool.query<Record<string, unknown>>(text, params);
      const duration = Date.now() - t0;
      onPooledQuerySuccess(duration, attempt, queryType, queryHash);
      return res;
    } catch (e) {
      lastErr = e;
      const duration = Date.now() - t0;
      const transient = isTransientPooledError(e);
      if (process.env.DB_QUERY_LOG !== "0") {
        console.log(
          JSON.stringify({
            event: "db_query",
            duration,
            retries: attempt,
            success: false,
            queryType,
            queryHash,
            transient,
            willRetry: transient && attempt < maxAttempts - 1,
          })
        );
      }
      if (!transient) {
        onPooledQueryFinalFailure(e, Date.now() - t0All, attempt, queryType, queryHash, false);
        throw e;
      }
      if (attempt === maxAttempts - 1) {
        onPooledQueryFinalFailure(e, Date.now() - t0All, attempt, queryType, queryHash, true);
        throw e;
      }
      const delay = BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 100;
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Migration guard: when `USE_NEW_DB=1`, run the callback on `@repo/db-core` first, then
 * fall back to the monolith client on any error. Logs each fallback to {@link getFallbacks}
 * via in-memory log (and console).
 *
 * Order 76.1 — respects DB circuit: throws {@link DbUnavailableError} when the cooling window is active.
 */
export async function safeQuery<T>(label: string, fn: (db: MonolithClient) => Promise<T>): Promise<T> {
  ensureDbCircuitOrThrow();
  if (!USE_NEW_DB) {
    return fn(tracedMonolithDB as unknown as MonolithClient);
  }
  try {
    return await fn(tracedCoreDB as unknown as MonolithClient);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[DB FALLBACK]", { label, error: message });
    logFallback(label, message);
    return fn(tracedMonolithDB as unknown as MonolithClient);
  }
}

/**
 * @deprecated Use {@link safeQuery} with a label for observability. This wrapper uses a fixed label.
 */
export async function prismaWithCoreFallback<T>(fn: (db: MonolithClient) => Promise<T>): Promise<T> {
  return safeQuery("prismaWithCoreFallback", fn);
}

/**
 * Structured logging for ad-hoc raw SQL — uses {@link queryWithRetry} (resilience + backoff).
 * Previously in `lib/db-direct.ts` (Order 82 — unified under `lib/db` + this module).
 */
export async function loggedQuery(
  text: string,
  params?: unknown[]
): Promise<QueryResult<Record<string, unknown>>> {
  return queryWithRetry(text, params, 2);
}

/**
 * Order 76.1 — raw SQL with a timeout ceiling, query hash, timeout metric, and `DB_TIMEOUT` error.
 */
export async function safePooledQuery(
  text: string,
  params?: unknown[]
): Promise<QueryResult<Record<string, unknown>>> {
  const queryHash = hashQueryText(text);
  ensureDbCircuitOrThrow();
  return traceSQL("safePooledQuery", async () => {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        metricsTimeouts += 1;
        const err = new DbTimeoutError(queryHash, QUERY_TIMEOUT_MS);
        if (process.env.DB_QUERY_LOG !== "0") {
          console.log(
            JSON.stringify({
              event: "db_query_timeout",
              queryHash,
              duration: QUERY_TIMEOUT_MS,
              code: DB_ERROR_CODES.TIMEOUT,
            })
          );
        }
        Sentry.captureException(err, {
          tags: { layer: "db", queryType: "raw_timeout" },
          extra: { queryHash, duration: QUERY_TIMEOUT_MS, retries: 0 },
        });
        reject(err);
      }, QUERY_TIMEOUT_MS);
    });
    const pending = queryWithRetry(text, params, 2);
    return Promise.race([pending, timeout]);
  });
}
