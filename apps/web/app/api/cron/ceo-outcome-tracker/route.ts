import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { trackCeoOutcomes } from "@/modules/ceo-ai/ceo-outcome-tracker.service";

export const dynamic = "force-dynamic";

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/**
 * POST/GET /api/cron/ceo-outcome-tracker — periodic CEO decision outcome snapshots (hourly on Vercel).
 * Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await trackCeoOutcomes();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    logError("[api.cron.ceo-outcome-tracker]", { error: e });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
