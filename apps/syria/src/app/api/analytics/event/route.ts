import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { parseUtmFromSearchParams } from "@/lib/utm";

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

  await trackSyriaGrowthEvent({
    eventType,
    userId: session?.id ?? null,
    propertyId: typeof o.propertyId === "string" ? o.propertyId : null,
    bookingId: typeof o.bookingId === "string" ? o.bookingId : null,
    inquiryId: typeof o.inquiryId === "string" ? o.inquiryId : null,
    utm,
    payload,
  });

  return NextResponse.json({ ok: true });
}
