import type { NextRequest } from "next/server";
import { logInfo } from "@/lib/logger";
import { runLearningCycle } from "@/modules/autonomy/learning/learning-cycle.service";

export const dynamic = "force-dynamic";

/**
 * GET/POST `/api/cron/autonomy-learning-run` — evaluate autonomy outcomes + update bounded rule weights.
 * Vercel Cron: GET + `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const out = await runLearningCycle();
  logInfo("[cron-autonomy-learning-run]", { evaluated: out.evaluatedCount });
  return Response.json({ ok: true, success: true, evaluated: out.evaluatedCount, results: out.results });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
