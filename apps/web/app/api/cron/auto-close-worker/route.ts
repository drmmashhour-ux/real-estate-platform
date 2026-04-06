import { NextRequest } from "next/server";
import { logInfo } from "@/lib/logger";
import { readAutoCloseEnv, runAutoCloseHourlyPass } from "@/src/modules/autoclose/autoCloseEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/auto-close-worker — hourly safe auto-close (follow-up queue, high-intent nudges, booking ops signals).
 * Requires: AI_AUTOCLOSE_ENABLED=1 AND AI_AUTOCLOSE_SAFE_MODE=1. Respects AutoCloseSettings.paused.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = readAutoCloseEnv();
  const summary = await runAutoCloseHourlyPass();

  if (summary.inactivityNudges + summary.leadReactivations + summary.bookingReminders > 0 || summary.errors.length > 0) {
    logInfo("[auto-close-worker]", { env, ...summary });
  }

  return Response.json({ ok: true, env, ...summary });
}
