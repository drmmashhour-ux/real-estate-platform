import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { logInfo } from "@/lib/logger";

/** Lightweight process + DB pulse for dashboards (no external HTTP self-call). */
export async function getSystemHealthSnapshot() {
  const t0 = Date.now();
  let dbLatencyMs: number | null = null;
  let dbOk = false;
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { maxAttempts: 2, baseDelayMs: 100 });
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    logInfo("[launch][system_health] db_check_failed", { error: String(e) });
  }

  return {
    ok: dbOk,
    dbOk,
    dbLatencyMs,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? null,
    time: new Date().toISOString(),
  };
}
