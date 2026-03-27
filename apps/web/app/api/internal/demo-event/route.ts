import { NextRequest, NextResponse } from "next/server";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { isDemoEventName } from "@/lib/demo-event-types";

export const dynamic = "force-dynamic";

/**
 * Server-to-server demo analytics (blocked_action from middleware, etc.).
 * Authorization: Bearer CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event?: string; metadata?: Record<string, unknown>; userId?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event.trim() : "";
  if (!event) {
    return NextResponse.json({ error: "event required" }, { status: 400 });
  }
  if (!isDemoEventName(event)) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  await trackDemoEvent(event, body.metadata, body.userId ?? undefined);
  return NextResponse.json({ ok: true });
}
