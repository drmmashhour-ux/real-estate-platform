import { NextResponse } from "next/server";
import { ShareSessionType } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/insurance/client-ip";
import { getPublicSharePayload } from "@/lib/share-my-stay/get-public-share";

export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated read for trusted contacts who received the raw token URL.
 * Rate-limited per IP; returns minimal fields only.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const ip = getClientIpFromRequest(request);
  const rl = checkRateLimit(`public-share:${ip}`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const { token } = await context.params;
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const resolved = await getPublicSharePayload(token, { clientIp: ip });

  if (!resolved.found) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: getRateLimitHeaders(rl) });
  }

  if (resolved.payload.kind === "inactive") {
    return NextResponse.json(
      {
        active: false,
        state: resolved.payload.state,
        message: resolved.payload.message,
      },
      { headers: getRateLimitHeaders(rl) }
    );
  }

  const p = resolved.payload;
  const payload: Record<string, unknown> = {
    active: true,
    sessionStatus: p.sessionStatus,
    shareType: p.shareType,
    guestFirstName: p.guestFirstName,
    listingName: p.listingName,
    listingCity: p.listingCity,
    stayStatus: p.stayStatus,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    expiresAt: p.expiresAt,
  };

  if (p.shareType === ShareSessionType.LIVE_LOCATION && p.lastLocation) {
    payload.lastLocation = p.lastLocation;
  } else {
    payload.lastLocation = null;
  }

  return NextResponse.json(payload, { headers: getRateLimitHeaders(rl) });
}
