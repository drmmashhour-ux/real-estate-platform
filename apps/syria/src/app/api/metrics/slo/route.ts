import { prisma } from "@/lib/db";
import { runSyriaDrBrainReportReadOnly } from "@/lib/drbrain";

export const dynamic = "force-dynamic";

/**
 * Aggregate SLO snapshot — no secrets, raw logs, or user-identifiable data.
 */
function numEnv(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET() {
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  let drBrainStatus: "OK" | "WARNING" | "CRITICAL" = "OK";
  try {
    const report = await runSyriaDrBrainReportReadOnly();
    drBrainStatus = report.status;
  } catch {
    drBrainStatus = "CRITICAL";
  }

  const errorRate = numEnv("METRICS_SLO_ERROR_RATE", 0.008);
  const p95LatencyMs = Math.round(numEnv("METRICS_SLO_P95_MS", 260));
  const paymentErrorRate = numEnv("METRICS_SLO_PAYMENT_ERROR_RATE", 0);

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
