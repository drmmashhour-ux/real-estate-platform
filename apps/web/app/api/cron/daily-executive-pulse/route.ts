import { NextRequest } from "next/server";

import { getNotificationEmail } from "@/lib/email/resend";
import { sendDailyExecutiveReportAllChannels } from "@/modules/notifications/daily-report.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/daily-executive-pulse — daily admin email + Expo push (uses `buildDailyExecutiveReportText`).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = (process.env.ADMIN_NOTIFY_EMAIL?.trim() || getNotificationEmail()).trim();
  if (!to.includes("@")) {
    return Response.json({ ok: false, error: "No admin email configured" }, { status: 500 });
  }

  try {
    const result = await sendDailyExecutiveReportAllChannels(to);
    return Response.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "daily_pulse_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
