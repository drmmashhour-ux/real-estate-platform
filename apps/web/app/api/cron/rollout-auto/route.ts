import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { runRolloutAutoForAllRunning } from "@/modules/rollout/rollout-auto-engine.service";

export const dynamic = "force-dynamic";

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/** POST/GET /api/cron/rollout-auto — metrics snapshot + auto ramp / rollback. */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await runRolloutAutoForAllRunning();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    logError("[api.cron.rollout-auto]", { error: e });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
