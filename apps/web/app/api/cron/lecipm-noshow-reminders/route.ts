import { NextRequest, NextResponse } from "next/server";
import { processLecipmNoShowReminderBatch } from "@/modules/no-show-prevention/no-show-reminder.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/lecipm-noshow-reminders — 24h / 3h / optional 30m reminders.
 * Authorization: Bearer `CRON_SECRET`
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out = await processLecipmNoShowReminderBatch();
  return NextResponse.json({ kind: "lecipm_noshow_reminder_batch_v1", ...out });
}
