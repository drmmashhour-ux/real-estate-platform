import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { parseUtmFromSearchParams } from "@/lib/utm";
import { s2GetClientIp } from "@/lib/security/s2-ip";
import { evaluateListingShareAbuse, hashSybn113ClientIp } from "@/lib/syria/share-abuse";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const eventType = typeof o.eventType === "string" ? o.eventType.trim() : "";
  if (!eventType) {
    return NextResponse.json({ ok: false, error: "missing_event_type" }, { status: 400 });
  }

  const session = await getSessionUser();
  const payload =
    o.payload && typeof o.payload === "object" && !Array.isArray(o.payload)
      ? (o.payload as Record<string, unknown>)
      : {};

  const utm =
    typeof o.utm_source === "string" || typeof o.utm_medium === "string" || typeof o.utm_campaign === "string"
      ? parseUtmFromSearchParams({
          utm_source: typeof o.utm_source === "string" ? o.utm_source : undefined,
          utm_medium: typeof o.utm_medium === "string" ? o.utm_medium : undefined,
          utm_campaign: typeof o.utm_campaign === "string" ? o.utm_campaign : undefined,
        })
      : undefined;

  const propertyId = typeof o.propertyId === "string" ? o.propertyId : null;

  /** ORDER SYBNB-113 — share spam: daily cap + burst dilution on same listing. */
  if (eventType === "listing_shared") {
    if (!propertyId) {
      return NextResponse.json({ ok: false, error: "missing_property_id" }, { status: 400 });
    }
    const ip = s2GetClientIp(req);
    const ipHash = hashSybn113ClientIp(ip);
    const decision = await evaluateListingShareAbuse({
      userId: session?.id ?? null,
      ipHash,
      propertyId,
    });
    if (!decision.allowed) {
      return NextResponse.json({ ok: false, error: "share_rate_limited" }, { status: 429 });
    }
    const mergedPayload: Record<string, unknown> = {
      ...payload,
      sybn113: {
        ipHash,
        diluted: decision.diluted,
        ...(decision.diluted ? { burst: true } : {}),
        trackingWeight: decision.diluted ? 0.25 : 1,
      },
    };
    await trackSyriaGrowthEvent({
      eventType,
      userId: session?.id ?? null,
      propertyId,
      bookingId: typeof o.bookingId === "string" ? o.bookingId : null,
      inquiryId: typeof o.inquiryId === "string" ? o.inquiryId : null,
      utm,
      payload: mergedPayload,
    });
    void import("@/lib/sy8/sy8-feed-rank-refresh").then((m) => m.recomputeSy8FeedRankForPropertyId(propertyId));
    return NextResponse.json({ ok: true });
  }

  await trackSyriaGrowthEvent({
    eventType,
    userId: session?.id ?? null,
    propertyId,
    bookingId: typeof o.bookingId === "string" ? o.bookingId : null,
    inquiryId: typeof o.inquiryId === "string" ? o.inquiryId : null,
    utm,
    payload,
  });

  return NextResponse.json({ ok: true });
}
