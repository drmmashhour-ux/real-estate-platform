import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { mergeTrafficAttributionIntoMetadata } from "@/lib/attribution/social-traffic";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "search_performed",
  "listing_view",
  "property_viewed",
]);

/**
 * Lightweight client events for anonymous + authenticated users (rate-limited).
 * Does not replace authenticated `/api/growth/track`.
 */
export async function POST(req: NextRequest) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`public_track:${ip}`, { max: 40, windowMs: 60_000 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let body: { eventType?: string; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!eventType || !ALLOWED.has(eventType)) {
    return Response.json({ error: "eventType not allowed" }, { status: 400 });
  }

  const userId = await getGuestId();
  const normalized = eventType === "property_viewed" ? "listing_view" : eventType;
  const h = await headers();
  const meta =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : {};
  const merged = mergeTrafficAttributionIntoMetadata(h.get("cookie"), meta);
  await trackEvent(normalized, merged, { userId });
  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
