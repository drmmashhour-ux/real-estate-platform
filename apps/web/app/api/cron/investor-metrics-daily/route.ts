import { NextRequest } from "next/server";
import { logInfo } from "@/lib/logger";
import { captureAndStoreMetricSnapshot } from "@/src/modules/investor-metrics/metricsSnapshot";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/investor-metrics-daily — upsert daily `MetricSnapshot` (UTC day).
 * Vercel Cron uses GET + `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await captureAndStoreMetricSnapshot(new Date());
  logInfo("[investor-metrics-daily]", result);

  return Response.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
