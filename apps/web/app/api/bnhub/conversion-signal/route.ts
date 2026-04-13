import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  CONVERSION_SIGNAL_EVENT_TYPES,
  recordAiConversionSignal,
} from "@/lib/ai/conversion/conversion-signals";
import type { ConversionEventType } from "@/lib/ai/conversion/conversion-types";
import { logSecurityEvent } from "@/lib/observability/security-events";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>(CONVERSION_SIGNAL_EVENT_TYPES);

/** CUID or UUID — avoids arbitrary strings hitting `listingId`. */
const LISTING_ID_RE = /^[a-z0-9-]{16,40}$/i;

/**
 * POST /api/bnhub/conversion-signal — persist real BNHUB funnel events (no fabricated demand).
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get(REQUEST_ID_HEADER);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub:conversion-signal:${ip}`, { windowMs: 60_000, max: 180 });
  if (!rl.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      detail: "bnhub_conversion_signal",
      subjectHint: ip.slice(0, 24),
      requestId,
    });
    return NextResponse.json(
      { ok: false, error: "Too many events", code: "RATE_LIMITED" },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "INVALID_JSON" }, { status: 400 });
  }

  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!eventType || !ALLOWED.has(eventType)) {
    return NextResponse.json({ ok: false, error: "Invalid eventType", code: "INVALID_EVENT_TYPE" }, { status: 400 });
  }
  if (!listingId || !LISTING_ID_RE.test(listingId)) {
    return NextResponse.json(
      { ok: false, error: "listingId must be a valid listing identifier", code: "INVALID_LISTING_ID" },
      { status: 400 },
    );
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Listing not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const meta =
    body.metadata != null && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  const userId = await getGuestId().catch(() => null);

  const row = await recordAiConversionSignal(prisma, {
    listingId,
    guestId: userId,
    eventType: eventType as ConversionEventType,
    metadata: meta,
  });

  return NextResponse.json(
    { ok: true, id: row.id, code: "CREATED" },
    { headers: getRateLimitHeaders(rl) },
  );
}
