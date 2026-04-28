/**
 * Order 73.1 / 81.1 — **This is the ONLY place a `pg` `Pool` is created** for the web app
 * (no ad-hoc `new Pool` elsewhere; use `import { pool, query, … } from "@/lib/db"`).
 * Tuning: `max` 10 default, `idleTimeoutMillis` 30s, `connectionTimeoutMillis` 5s.
 */
import "server-only";

import { Pool } from "pg";
import * as Sentry from "@sentry/nextjs";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
};

const poolMax = Number.parseInt(process.env.PGPOOL_MAX ?? "10", 10) || 10;
const poolConnTimeout = Number.parseInt(process.env.PG_TIMEOUT ?? "5000", 10) || 5000;
const POOL_IDLE_TIMEOUT_MS = 30_000;

let lastPoolSaturationLogAt = 0;
const POOL_SATURATION_LOG_THROTTLE_MS = 30_000;

function createPgPool(): Pool {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: poolMax,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: poolConnTimeout,
  });
  p.on("error", (err) => {
    console.error("[PG POOL ERROR]", err);
    Sentry.captureException(err, { tags: { layer: "pg_pool" } });
  });
  return p;
}

function noopPgPoolPlaceholder(): Pool {
  const noop = {} as Pool;
  Object.assign(noop, {
    query: (): Promise<{ rows: never[]; rowCount: number }> => Promise.resolve({ rows: [], rowCount: 0 }),
    connect: (): Promise<{ release: () => void }> => Promise.resolve({ release: (): void => undefined }),
    end: (): Promise<void> => Promise.resolve(),
    on: (): Pool => noop,
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  });
  return noop;
}

export const pool =
  globalForDb.pool ??
  (process.env.NEXT_PUBLIC_DISABLE_DB === "true" ? noopPgPoolPlaceholder() : createPgPool());

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export function getPoolStats(): { total: number; idle: number; waiting: number } {
  const total = pool.totalCount;
  const idle = pool.idleCount;
  const waiting = pool.waitingCount;
  if (waiting > 0) {
    const now = Date.now();
    if (now - lastPoolSaturationLogAt >= POOL_SATURATION_LOG_THROTTLE_MS) {
      lastPoolSaturationLogAt = now;
      console.warn("DB pool saturation detected", { total, idle, waiting });
      Sentry.captureMessage("DB pool saturation detected", {
        level: "warning",
        tags: { layer: "pg_pool" },
        extra: { total, idle, waiting },
      });
    }
  }
  return { total, idle, waiting };
}
