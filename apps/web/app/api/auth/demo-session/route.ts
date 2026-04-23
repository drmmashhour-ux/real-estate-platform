import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie } from "@/lib/auth/session";
import { ensureReferralCode } from "@/lib/referrals";
import { DEMO_AUTH_DISABLED_MESSAGE, isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/** POST /api/auth/demo-session — Set session cookie for demo user (email). Blocked in production (no impersonation). */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isDemoAuthAllowed()) {
    return NextResponse.json({ error: DEMO_AUTH_DISABLED_MESSAGE }, { status: 403 });
  }
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const limit = checkRateLimit(`auth:demo-session:${ip}`, { windowMs: 60_000, max: 20 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many demo sign-ins. Slow down." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const res = NextResponse.json({ ok: true, userId: user.id });
    await ensureReferralCode(user.id).catch(() => {});
    const sessionToken = await createDbSession(user.id);
    const cookie = setGuestIdCookie(sessionToken);
    res.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}
