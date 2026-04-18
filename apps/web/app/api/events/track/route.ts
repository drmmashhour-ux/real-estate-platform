import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { logProductEvent } from "@/src/modules/events/event.service";
import { PRODUCT_EVENT_SET } from "@/src/modules/events/event.constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const limit = checkRateLimit(`events:track:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many events" }, { status: 429, headers: getRateLimitHeaders(limit) });
  }

  const body = (await req.json().catch(() => ({}))) as {
    eventType?: string;
    sessionId?: string;
    listingId?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  };

  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!eventType || eventType.length > 80) {
    return NextResponse.json({ ok: false, error: "invalid_eventType" }, { status: 400 });
  }
  if (!PRODUCT_EVENT_SET.has(eventType)) {
    return NextResponse.json({ ok: false, error: "unsupported_eventType" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 128) : undefined;
  const userId = await getGuestId().catch(() => null);

  const id = await logProductEvent({
    eventType,
    userId,
    sessionId: sessionId ?? null,
    listingId: typeof body.listingId === "string" ? body.listingId.slice(0, 64) : null,
    entityType: typeof body.entityType === "string" ? body.entityType.slice(0, 64) : null,
    entityId: typeof body.entityId === "string" ? body.entityId.slice(0, 64) : null,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  });

  return NextResponse.json({ ok: true, id });
}
