import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/mortgage-expert-daily — reset per-expert daily lead counters (UTC day roll is job schedule).
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await prisma.mortgageExpert.updateMany({
    data: { currentLeadsToday: 0 },
  });
  return NextResponse.json({ ok: true, expertsReset: result.count });
}
