import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { extendShareSession } from "@/lib/share-my-stay/extend-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  let body: { addMinutes?: unknown; preset?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await extendShareSession({ sessionId: id, guestUserId: userId, body });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, expiresAt: result.expiresAtIso });
}
