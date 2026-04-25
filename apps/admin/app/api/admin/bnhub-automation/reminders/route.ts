import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { processBnhubNoBookingReminders } from "@/lib/bnhub/revenue-automation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { olderThanDays?: number; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const sent = await processBnhubNoBookingReminders({
    olderThanDays: body.olderThanDays,
    limit: body.limit,
  });

  return NextResponse.json({ ok: true, remindersSent: sent });
}
