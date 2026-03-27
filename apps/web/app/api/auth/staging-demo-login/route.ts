import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";
import { ensureReferralCode } from "@/lib/referrals";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordPlatformEvent } from "@/lib/observability";
import { trackDemoEvent, trackDemoUserTypeFromRole } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { DEMO_SESSION_COOKIE_MAX_AGE_SEC, DEMO_SESSION_STARTED_AT_COOKIE } from "@/lib/demo-session-cookie";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

/**
 * One-click demo session for staging only. Enable with STAGING_DEMO_LOGIN=1 on the staging Vercel project.
 * User must exist (e.g. from seed / npm run client:test-user). Does not accept a password in the body.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    return NextResponse.json({ error: "Not available." }, { status: 403 });
  }
  if (process.env.STAGING_DEMO_LOGIN !== "1" && process.env.STAGING_DEMO_LOGIN !== "true") {
    return NextResponse.json({ error: "Demo login is disabled." }, { status: 403 });
  }

  const email = (process.env.DEMO_LOGIN_EMAIL || "demo@platform.com").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Demo account is not provisioned." }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "staging-demo-login";
  const limit = checkRateLimit(`auth:staging-demo:${ip}`, { windowMs: 60_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  void recordPlatformEvent({
    eventType: "auth_login_success",
    sourceModule: "auth",
    entityType: "USER",
    entityId: user.id,
  }).catch(() => {});

  await ensureReferralCode(user.id).catch(() => {});

  void trackDemoEvent(DemoEvents.LOGIN, { source: "staging_demo" }, user.id);
  void trackDemoEvent(DemoEvents.SESSION_START, { source: "staging_demo" }, user.id);
  trackDemoUserTypeFromRole(user.id, user.role);

  const res = NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const cookie = setGuestIdCookie(user.id);
  res.cookies.set(cookie.name, cookie.value, {
    path: cookie.path,
    maxAge: cookie.maxAge,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  });
  const roleCk = setUserRoleCookie(user.role);
  res.cookies.set(roleCk.name, roleCk.value, {
    path: roleCk.path,
    maxAge: roleCk.maxAge,
    httpOnly: roleCk.httpOnly,
    secure: roleCk.secure,
    sameSite: roleCk.sameSite,
  });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(DEMO_SESSION_STARTED_AT_COOKIE, String(Date.now()), {
    path: "/",
    maxAge: DEMO_SESSION_COOKIE_MAX_AGE_SEC,
    httpOnly: true,
    secure,
    sameSite: "lax",
  });
  captureServerEvent(user.id, AnalyticsEvents.LOGIN_COMPLETED, { source: "staging_demo_login" });
  return res;
}
