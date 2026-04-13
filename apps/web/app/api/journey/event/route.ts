import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsFunnelEventName } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { trackJourneyEvent } from "@/lib/journey/track-journey-event";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>([
  "landing_visit",
  "search_used",
  "listing_click",
  "booking_started",
]);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`journey:event:${ip}`, { windowMs: 60_000, max: 120 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many events" },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: {
    name?: string;
    listingId?: string | null;
    sessionId?: string | null;
    metadata?: Record<string, unknown> | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
  if (!nameRaw || !ALLOWED.has(nameRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
  }

  const listingId =
    typeof body.listingId === "string" && body.listingId.length > 0 ? body.listingId.trim().slice(0, 64) : null;

  const userId = await getGuestId().catch(() => null);
  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 64) : null;

  await trackJourneyEvent({
    name: nameRaw as AnalyticsFunnelEventName,
    listingId,
    userId,
    sessionId,
    source: "client_beacon",
    metadata: body.metadata ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
