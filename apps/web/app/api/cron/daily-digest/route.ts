import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateDailyDigest } from "@/lib/digest/generator";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/daily-digest — optional scheduled generation for one user.
 * Example schedule: `0 7 * * *` (07:00) with Bearer CRON_SECRET.
 * Authorization: Bearer CRON_SECRET
 * Body: { userId: string, ownerType?: string, sendEmail?: boolean }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    ownerType?: string;
    sendEmail?: boolean;
  };
  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const ownerType =
    typeof body.ownerType === "string" && body.ownerType.length > 0 ? body.ownerType : "solo_broker";

  try {
    const digest = await generateDailyDigest(ownerType, body.userId, {
      sendEmail: Boolean(body.sendEmail),
    });
    return NextResponse.json({ success: true, digest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Digest failed";
    const status =
      msg === "GUARANTEED_OUTCOME_FORBIDDEN" || msg === "AUTONOMOUS_DIGEST_EXECUTION_FORBIDDEN" ? 422 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
