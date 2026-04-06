import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { recordLecipmManagerGrowthEvent } from "@/lib/growth/manager-events";
import type { GrowthEventName, GrowthUiLocale } from "@/lib/growth/types";
import { MANAGER_GROWTH_EVENT_NAMES } from "@/lib/growth/types";
import { getResolvedMarket } from "@/lib/markets/resolve-market";

export const dynamic = "force-dynamic";

/** Public + authenticated beacon events (rate-limited). Server-side validation only. */
const PUBLIC_ALLOW = new Set<GrowthEventName>([
  "landing_page_viewed",
  "listings_browse_viewed",
  "listing_viewed",
  "language_switched",
  "market_mode_used",
]);

const AUTH_EXTRA = new Set<GrowthEventName>([
  "contact_host_clicked",
  "booking_request_started",
  "booking_request_submitted",
  "checkout_started",
  "host_signup_started",
  "host_signup_completed",
  "listing_created",
  "listing_published",
  "ai_suggestion_accepted",
]);

function isLocale(s: string | undefined): s is GrowthUiLocale {
  return s === "en" || s === "fr" || s === "ar";
}

export async function POST(req: NextRequest) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`mgr_growth:${ip}`, { max: 90, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let body: {
    event?: string;
    listingId?: string;
    locale?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.event === "string" ? body.event.trim() : "";
  if (!MANAGER_GROWTH_EVENT_NAMES.includes(name as GrowthEventName)) {
    return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
  }
  const event = name as GrowthEventName;

  const userId = await getGuestId().catch(() => null);
  const allowed = PUBLIC_ALLOW.has(event) || (userId && AUTH_EXTRA.has(event));
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (event === "listing_viewed" && typeof body.listingId !== "string") {
    return NextResponse.json({ ok: false, error: "listingId required" }, { status: 400 });
  }

  let marketCode: string | null = null;
  try {
    const m = await getResolvedMarket();
    marketCode = m.code;
  } catch {
    marketCode = null;
  }

  const locRaw = typeof body.locale === "string" ? body.locale.trim().toLowerCase() : "";
  const locale = isLocale(locRaw) ? locRaw : null;

  const path = typeof body.path === "string" ? body.path : undefined;
  await recordLecipmManagerGrowthEvent(event, {
    userId,
    listingId: typeof body.listingId === "string" ? body.listingId : undefined,
    marketCode,
    locale,
    metadata: {
      ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
      ...(path ? { path } : {}),
    },
  });

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
