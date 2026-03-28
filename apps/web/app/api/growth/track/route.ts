import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/** POST /api/growth/track — authenticated product events → `user_events`. */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { eventType?: string; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!eventType) {
    return Response.json({ error: "eventType required" }, { status: 400 });
  }
  await trackEvent(eventType, body.metadata ?? {}, { userId });
  return Response.json({ ok: true });
}
