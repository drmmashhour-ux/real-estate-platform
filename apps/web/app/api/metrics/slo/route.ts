import { getLegacyDB } from "@/lib/db/legacy";

export const dynamic = "force-dynamic";

/**
 * Aggregate SLO snapshot — no secrets, raw logs, or user-identifiable data.
 * Numeric fields default from METRICS_SLO_* env until wired to observability backends.
 */

function numEnv(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function drBrainLabel(): "OK" | "WARNING" | "CRITICAL" {
  const raw = process.env.METRICS_SLO_DRBRAIN_STATUS?.trim()?.toUpperCase();
  if (raw === "WARNING" || raw === "CRITICAL" || raw === "OK") return raw;
  return "OK";
}

export async function GET() {
  let dbHealthy = false;
  try {
    const prisma = getLegacyDB();
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  const errorRate = numEnv("METRICS_SLO_ERROR_RATE", 0.005);
  const p95LatencyMs = Math.round(numEnv("METRICS_SLO_P95_MS", 220));
  const paymentErrorRate = numEnv("METRICS_SLO_PAYMENT_ERROR_RATE", 0);
  const drBrainStatus = drBrainLabel();

  const degraded = !dbHealthy || drBrainStatus === "CRITICAL";

  return Response.json({
    status: degraded ? "degraded" : "ok",
    errorRate,
    p95LatencyMs,
    dbHealthy,
    paymentErrorRate,
    drBrainStatus,
  });
}
