import { pool, setPoolProbeResult } from "./db";

export type CheckReadyResult = {
  ok: boolean;
  /** Time for `SELECT 1` on the shared `pg` pool, or `null` on failure. */
  latencyMs: number | null;
};

/**
 * Order 75/76.1 — low-level TCP pool probe; measures latency and updates degraded-mode signals
 * in {@link setPoolProbeResult} (independent of Prisma / `USE_NEW_DB`).
 * For load balancers: pair with `GET /api/ready` which also checks app config.
 */
export async function checkReady(): Promise<CheckReadyResult> {
  const t0 = Date.now();
  try {
    await pool.query("SELECT 1");
    const latencyMs = Date.now() - t0;
    setPoolProbeResult(true, latencyMs);
    return { ok: true, latencyMs };
  } catch {
    setPoolProbeResult(false, null);
    return { ok: false, latencyMs: null };
  }
}
