import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { runAutonomyCycle } from "@/modules/autonomy/autonomy-engine.service";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/** Daily LECIPM autonomy loop — analyze, propose, auto-apply safe deltas (<5%). */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAutonomyCycle();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logError("[api.cron.autonomy-engine]", { error: e });
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
