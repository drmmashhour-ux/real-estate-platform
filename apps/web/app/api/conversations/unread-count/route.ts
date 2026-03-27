import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUnreadMessageCountForUser } from "@/modules/messaging/services/get-unread-count";

export const dynamic = "force-dynamic";

/** GET /api/conversations/unread-count */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const total = await getUnreadMessageCountForUser(userId);
  return NextResponse.json({ total });
}
