import { NextRequest } from "next/server";
import { processExecutiveControlCycle } from "@/src/workers/executiveControlWorker";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/executive-weekly — Weekly KPI snapshot + full scoring + recommendations pass.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processExecutiveControlCycle("weekly");
    return Response.json({ ok: true, mode: "weekly", ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "executive_weekly_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
