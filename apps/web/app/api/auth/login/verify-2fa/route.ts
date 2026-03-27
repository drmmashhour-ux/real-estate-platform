import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { applyLoginSessionCookies } from "@/lib/auth/apply-login-session";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { recordPlatformEvent } from "@/lib/observability";

const MAX_ATTEMPTS = 5;

/** POST /api/auth/login/verify-2fa — Complete login after email 2FA code. */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous";
    const limit = checkRateLimit(`auth:2fa:${ip}`, { windowMs: 60 * 1000, max: 30 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const codeRaw = typeof body?.code === "string" ? body.code.trim().replace(/\D/g, "") : null;

    if (!email || !codeRaw || codeRaw.length !== 6) {
      return NextResponse.json({ error: "Email and 6-digit code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.emailVerifiedAt) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    const row = await prisma.twoFactorCode.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!row) {
      return NextResponse.json({ error: "Code expired or already used. Sign in again." }, { status: 401 });
    }

    if (row.attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many failed attempts. Sign in again." }, { status: 429 });
    }

    if (row.code !== codeRaw) {
      await prisma.twoFactorCode.update({
        where: { id: row.id },
        data: { attemptCount: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    await prisma.twoFactorCode.update({ where: { id: row.id }, data: { used: true } });

    void recordPlatformEvent({
      eventType: "auth_login_success",
      sourceModule: "auth",
      entityType: "USER",
      entityId: user.id,
    }).catch(() => {});

    let expertTermsAccepted: boolean | undefined;
    if (isMortgageExpertRole(user.role)) {
      const me = await prisma.mortgageExpert.findUnique({
        where: { userId: user.id },
        select: { acceptedTerms: true },
      });
      expertTermsAccepted = me?.acceptedTerms ?? false;
    }

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      role: user.role,
      ...(isMortgageExpertRole(user.role) ? { expertTermsAccepted } : {}),
    });
    await applyLoginSessionCookies(res, { id: user.id, role: user.role });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
