import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { verifyPassword } from "@/lib/auth/password";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isInvestorDemoLoginEnabled } from "@/lib/investor/env";

export const dynamic = "force-dynamic";

/**
 * POST /api/investor/login — Investor-only session (PlatformRole.INVESTOR).
 * Staging/demo: `INVESTOR_DEMO_EMAIL` + `INVESTOR_DEMO_PASSWORD` bypasses password hash when enabled.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`investor:login:${ip}`, { windowMs: 60_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.role !== PlatformRole.INVESTOR) {
    return NextResponse.json(
      { error: "This account is not enabled for the investor portal." },
      { status: 403 }
    );
  }

  const demoEmail = process.env.INVESTOR_DEMO_EMAIL?.trim().toLowerCase();
  const demoPass = process.env.INVESTOR_DEMO_PASSWORD ?? "";
  const demoLogin =
    isInvestorDemoLoginEnabled() && demoEmail === email && demoPass.length > 0 && password === demoPass;

  if (demoLogin) {
    /* staging shortcut — still requires verified INVESTOR user row */
  } else {
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Password not set for this account" }, { status: 400 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "Email verification required" }, { status: 403 });
    }
  }

  const res = NextResponse.json({ ok: true, userId: user.id, email: user.email });
  const sessionToken = await createDbSession(user.id);
  const cookie = setGuestIdCookie(sessionToken);
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
  return res;
}
