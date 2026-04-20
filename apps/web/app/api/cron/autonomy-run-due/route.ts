import type { NextRequest } from "next/server";
import { logInfo } from "@/lib/logger";
import { runAutonomyDueBatch } from "@/modules/autonomy/autonomy-orchestrator.service";

export const dynamic = "force-dynamic";

/**
 * GET/POST `/api/cron/autonomy-run-due` — runs autonomy cycles for all enabled configs (batch cap 50).
 * Vercel Cron: GET + `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const out = await runAutonomyDueBatch({ take: 50 });
  logInfo("[cron-autonomy-run-due]", { processed: out.processed });
  return Response.json({ ok: true, success: true, ...out });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
