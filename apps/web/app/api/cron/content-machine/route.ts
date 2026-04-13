import { NextResponse } from "next/server";
import { runContentMachineDailyCron } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily: schedule backlog (video-ready pieces without pending schedules).
 * Set `CRON_SECRET` and call `GET /api/cron/content-machine?secret=...`
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get("secret")?.trim();
  if (!secret || q !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const out = await runContentMachineDailyCron();
  return NextResponse.json({ ok: true, ...out });
}
