import { NextRequest } from "next/server";
import { logInfo } from "@/lib/logger";
import { runSilentNudgeAndStalePass } from "@/src/workers/silentNudgeWorker";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/silent-nudge-worker — ghosting nudge + stale outcomes (~10 min cron).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runSilentNudgeAndStalePass(30);
  if (result.nudgesSent > 0) {
    logInfo("[silent-nudge-worker] batch", result);
  }
  return Response.json({
    ok: true,
    silentNudge: { sent: result.nudgesSent, skipped: result.nudgesSkipped },
    staleMarked: result.staleMarked,
  });
}
