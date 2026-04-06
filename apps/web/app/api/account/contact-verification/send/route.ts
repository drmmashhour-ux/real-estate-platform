import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { sendContactVerificationOtp, type ContactChannel } from "@/lib/account/contact-verification-service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/** POST { channel: "EMAIL" | "SMS", phone?: string } — send 6-digit code. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const limit = checkRateLimit(`contact-otp-send:${userId}:${ip}`, { windowMs: 60 * 1000, max: 8 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ch = typeof body.channel === "string" ? body.channel.toUpperCase() : "";
  if (ch !== "EMAIL" && ch !== "SMS") {
    return NextResponse.json({ error: "channel must be EMAIL or SMS" }, { status: 400 });
  }
  const phone = typeof body.phone === "string" ? body.phone : undefined;

  const result = await sendContactVerificationOtp({
    userId,
    channel: ch as ContactChannel,
    phone,
  });

  if (!result.ok) {
    const status =
      result.code === "RATE_LIMIT" ? 429 : result.code === "PHONE_REQUIRED" ? 400 : 503;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    channel: result.channel,
    destinationMask: result.destinationMask,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
