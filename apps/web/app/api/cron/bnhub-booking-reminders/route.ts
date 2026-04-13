import { NextRequest } from "next/server";
import { sendBnhubPendingBookingReminders } from "@/lib/bnhub/pending-booking-reminders";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/bnhub-booking-reminders — in-app reminders for guests with stale PENDING bookings.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendBnhubPendingBookingReminders();
  return Response.json({ ok: true, ...result });
}
