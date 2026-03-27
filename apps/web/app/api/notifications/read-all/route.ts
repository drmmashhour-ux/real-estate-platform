import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/modules/notifications/services/create-notification";
import { requireNotificationUser } from "@/modules/notifications/services/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await requireNotificationUser(request);
  if (user instanceof NextResponse) return user;

  const n = await markAllNotificationsRead(user.userId);
  return NextResponse.json({ ok: true, marked: n });
}
