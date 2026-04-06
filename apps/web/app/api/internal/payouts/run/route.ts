import { NextRequest, NextResponse } from "next/server";
import { runBnhubPayoutRunner } from "@/lib/payouts/runner";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/payouts/run — secured batch execution for cron (Bearer CRON_SECRET).
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

  const result = await runBnhubPayoutRunner();
  return NextResponse.json(result);
}
