import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/cache";
import {
  getDbResilienceMetrics,
  getDbResilienceState,
  getPoolStats,
  isDbCircuitOpen,
  safeQuery,
} from "@/lib/db";
import { checkReady } from "@/lib/ready";

export const dynamic = "force-dynamic";

const DEGRADED_LATENCY_MS = 2000;

export async function GET() {
  const poolCheck = await checkReady();
  const poolReady = poolCheck.ok;
  const resState = getDbResilienceState();
  const metrics = getDbResilienceMetrics();

  const base = {
    databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    stripe: "pending" as string,
    ai: "pending" as string,
    metrics,
  };

  if (process.env.VERCEL) {
    (base as Record<string, unknown>).runtime = "vercel";
  }

  let prismaOk = false;
  let prismaError: string | undefined;
  try {
    await safeQuery("api.ready.prismaPing", (db) => db.$queryRaw`SELECT 1`);
    prismaOk = true;
  } catch (e) {
    prismaOk = false;
    prismaError = e instanceof Error ? e.message : String(e);
  }

  if (process.env.STRIPE_SECRET_KEY) {
    base.stripe = "ok";
  } else {
    base.stripe = "missing_config";
  }
  if (process.env.OPENAI_API_KEY) {
    base.ai = "ok";
  } else {
    base.ai = "missing_config";
  }

  const dbOk = prismaOk && poolReady;
  const circuitOpen = isDbCircuitOpen() || resState.circuitOpen;
  const latencyMs = poolCheck.latencyMs;
  const poolStats = getPoolStats();
  const highLatency =
    typeof latencyMs === "number" && latencyMs >= DEGRADED_LATENCY_MS;

  let status: "ok" | "degraded" | "down" = "ok";
  if (!prismaOk || !poolReady || circuitOpen) {
    status = "down";
  } else if (
    base.databaseUrl === "missing" ||
    base.stripe === "missing_config" ||
    base.ai === "missing_config" ||
    highLatency
  ) {
    status = "degraded";
  }

  const ready =
    dbOk &&
    !circuitOpen &&
    base.databaseUrl !== "missing" &&
    process.env.DATABASE_URL != null;

  const body = {
    ready,
    status,
    cache: getCacheStats(),
    /** Unified DB health: `ok` is Prisma + pool probe; `pool` is live pg `Pool` stats. */
    db: {
      ok: dbOk,
      latencyMs,
      pool: {
        total: poolStats.total,
        idle: poolStats.idle,
        waiting: poolStats.waiting,
      },
      poolOk: poolReady,
      circuitOpen,
      prismaOk,
      ...(prismaError ? { error: prismaError } : {}),
    },
    /** @deprecated use `db.poolOk` (same: raw pg `SELECT 1` result from {@link checkReady}). */
    pgPool: poolReady,
    ...base,
  };

  const httpStatus =
    status === "down" || !ready ? 503 : 200;

  return NextResponse.json(body, { status: httpStatus });
}
