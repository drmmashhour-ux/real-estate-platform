import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setGuestIdCookie, setTenantContextCookie, setUserRoleCookie } from "@/lib/auth/session";
import { ensureReferralCode } from "@/lib/referrals";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { DEMO_SESSION_COOKIE_MAX_AGE_SEC, DEMO_SESSION_STARTED_AT_COOKIE } from "@/lib/demo-session-cookie";
import { isDemoAccountEmail } from "@/lib/demo/demo-account-constants";
import { isDemoQuickLoginAllowed } from "@/lib/demo/is-demo-quick-login-allowed";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

const PRESTIGE_SLUG = "prestige-realty-demo";
const URBAN_SLUG = "urban-property-advisors-demo";

async function defaultTenantIdForUser(userId: string): Promise<string | null> {
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { tenant: { select: { slug: true } } },
  });
  if (memberships.length === 0) return null;
  const p = memberships.find((m) => m.tenant.slug === PRESTIGE_SLUG);
  const u = memberships.find((m) => m.tenant.slug === URBAN_SLUG);
  const nonViewer = memberships.find((m) => m.role !== "VIEWER");
  if (nonViewer) return nonViewer.tenantId;
  return p?.tenantId ?? u?.tenantId ?? memberships[0]!.tenantId;
}

/** POST /api/auth/demo-login — Session for allowlisted demo emails (staging / DEMO_MODE only). */
export async function POST(request: NextRequest) {
  if (!isDemoQuickLoginAllowed()) {
    return NextResponse.json({ error: "Demo login is not enabled in this environment." }, { status: 403 });
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const limit = checkRateLimit(`auth:demo-login:${ip}`, { windowMs: 60_000, max: 30 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many demo sign-ins. Slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) },
      );
    }

    const body = await request.json();
    const raw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!raw) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    if (!isDemoAccountEmail(raw)) {
      return NextResponse.json({ error: "Email is not allowed for demo login." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { email: raw } });
    if (!user?.emailVerifiedAt) {
      return NextResponse.json({ error: "User not found or not verified." }, { status: 404 });
    }

    await ensureReferralCode(user.id).catch(() => {});

    const tenantId = await defaultTenantIdForUser(user.id);

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId,
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

    if (tenantId) {
      const tc = setTenantContextCookie(tenantId);
      res.cookies.set(tc.name, tc.value, {
        path: tc.path,
        maxAge: tc.maxAge,
        httpOnly: tc.httpOnly,
        secure: tc.secure,
        sameSite: tc.sameSite,
      });
    }

    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(DEMO_SESSION_STARTED_AT_COOKIE, String(Date.now()), {
      path: "/",
      maxAge: DEMO_SESSION_COOKIE_MAX_AGE_SEC,
      httpOnly: true,
      secure,
      sameSite: "lax",
    });

    captureServerEvent(user.id, AnalyticsEvents.LOGIN_COMPLETED, { source: "demo_login" });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
