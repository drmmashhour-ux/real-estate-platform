import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { recordGrowthEventWithFunnel } from "@/lib/growth/events";

export const dynamic = "force-dynamic";

const CLIENT_GROWTH = new Set(["view_listing", "booking_start"]);

/**
 * Authenticated client beacon for growth funnel (optional — server routes also emit events).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`growth:track:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many events" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const userId = await getGuestId().catch(() => null);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.event === "string" ? body.event.trim() : "";
  if (!CLIENT_GROWTH.has(name)) {
    return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
  }

  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : {};

  if (name === "view_listing" && typeof meta.listingId !== "string") {
    return NextResponse.json({ ok: false, error: "listingId required" }, { status: 400 });
  }

  if (name === "view_listing") {
    await recordGrowthEventWithFunnel("view_listing", { userId, metadata: meta });
  } else {
    await recordGrowthEventWithFunnel("booking_start", { userId, metadata: meta });
  }

  return NextResponse.json({ ok: true });
}
