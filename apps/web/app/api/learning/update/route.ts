import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { runMatchingLearning } from "@/modules/senior-living/learning.service";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/**
 * Daily learning job — adjusts MatchingWeight row within guardrails.
 * Secure with Authorization: Bearer $CRON_SECRET (same as other platform crons).
 * Vercel Cron invokes GET with the same header when CRON_SECRET is configured.
 */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMatchingLearning();
    return NextResponse.json(result);
  } catch (e) {
    logError("[api.learning.update]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
