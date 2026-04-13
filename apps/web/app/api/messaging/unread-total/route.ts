import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getTotalMessagingUnreadCount } from "@/lib/messaging/platform-unread";

export const dynamic = "force-dynamic";

/** CRM + BNHUB inquiry + booking chat unread (internal comms, not notification rows). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const total = await getTotalMessagingUnreadCount(userId);
  return NextResponse.json({ total });
}
