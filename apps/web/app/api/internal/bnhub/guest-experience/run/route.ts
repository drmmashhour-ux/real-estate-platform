import { NextRequest, NextResponse } from "next/server";
import { runBnhubGuestExperienceEngine } from "@/lib/bnhub/guest-experience/engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/bnhub/guest-experience/run — review asks, one reminder, repeat nudge (gated).
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBnhubGuestExperienceEngine();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Guest experience engine failed" }, { status: 500 });
  }
}
