import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { submitListingMessage } from "@/lib/syria/listing-message";
import { s2GetClientIp } from "@/lib/security/s2-ip";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const { id: listingId } = await ctx.params;
  if (!listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

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
  const name = typeof o.name === "string" ? o.name : "";
  const phone = typeof o.phone === "string" ? o.phone : undefined;
  const message = typeof o.message === "string" ? o.message : "";

  const session = await getSessionUser();
  const ip = s2GetClientIp(req);

  const out = await submitListingMessage({
    listingId,
    name,
    phone: phone?.trim() || null,
    message,
    utm: {
      utmSource: typeof o.utm_source === "string" ? o.utm_source : undefined,
      utmMedium: typeof o.utm_medium === "string" ? o.utm_medium : undefined,
      utmCampaign: typeof o.utm_campaign === "string" ? o.utm_campaign : undefined,
    },
    fromUserId: session?.id ?? null,
    clientIp: ip,
  });

  if (!out.ok) {
    const status =
      out.error === "listing_unavailable" ? 404
      : out.error === "use_booking_flow" ? 400
      : out.error === "messages_disabled" ? 403
      : out.error === "rate_limit_messages" ? 429
      : 400;
    return NextResponse.json({ ok: false, error: out.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    id: out.listingMessageId,
    inquiryId: out.inquiryId,
  });
}
