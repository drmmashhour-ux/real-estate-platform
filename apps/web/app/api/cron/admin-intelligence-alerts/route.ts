import { NextRequest } from "next/server";

import { runAdminAnomalyNotifications } from "@/modules/admin-intelligence/admin-intelligence-notify.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/admin-intelligence-alerts — HIGH anomaly email + Expo push to admins.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAdminAnomalyNotifications();
    return Response.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "admin_intel_notify_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
