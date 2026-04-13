import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { stopShareSession } from "@/lib/share-my-stay/stop-session";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const result = await stopShareSession({ sessionId: id, guestUserId: userId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
