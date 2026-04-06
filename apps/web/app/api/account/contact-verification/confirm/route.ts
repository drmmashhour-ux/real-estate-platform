import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { confirmContactVerificationOtp, type ContactChannel } from "@/lib/account/contact-verification-service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/** POST { channel: "EMAIL" | "SMS", code: string } — verify 6-digit code. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const limit = checkRateLimit(`contact-otp-confirm:${userId}:${ip}`, { windowMs: 60 * 1000, max: 30 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ch = typeof body.channel === "string" ? body.channel.toUpperCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (ch !== "EMAIL" && ch !== "SMS") {
    return NextResponse.json({ error: "channel must be EMAIL or SMS" }, { status: 400 });
  }

  const result = await confirmContactVerificationOtp({
    userId,
    channel: ch as ContactChannel,
    code,
  });

  if (!result.ok) {
    const status =
      result.code === "LOCKED" || result.code === "MISMATCH"
        ? 400
        : result.code === "NO_CODE"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, channel: result.channel });
}
