import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { recordPlatformEvent } from "@/lib/observability";
import { allocateUniqueUserCode } from "@/lib/user-code";
import { sendTwoFactorCodeEmail } from "@/lib/email/send";
import { applyLoginSessionCookies } from "@/lib/auth/apply-login-session";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { trackEvent } from "@/src/services/analytics";

function maskEmail(email: string): string {
  const [a, d] = email.split("@");
  if (!a || !d) return "***";
  const show = a.slice(0, Math.min(2, a.length));
  return `${show}***@${d}`;
}

/** POST /api/auth/login — Authenticate and set session. */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous";
    const rateKey = `auth:login:${ip}`;
    const limit = checkRateLimit(rateKey, { windowMs: 60 * 1000, max: 20 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = typeof body?.password === "string" ? body.password : null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.passwordHash) {
      const hint = isDemoAuthAllowed()
        ? "Account has no password yet; use BNHub demo sign-in in development or set a password via support."
        : "Account has no password set. Use password reset or contact support to activate password login.";
      return NextResponse.json({ error: hint }, { status: 400 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error:
            "Please confirm your email before signing in. Check your inbox for the message from LECIPM with the confirmation link.",
        },
        { status: 403 }
      );
    }

    if (!user.userCode) {
      const uid = user.id;
      await prisma.$transaction(async (tx) => {
        const code = await allocateUniqueUserCode(tx);
        await tx.user.update({ where: { id: uid }, data: { userCode: code } });
      });
      const refreshed = await prisma.user.findUnique({ where: { id: uid } });
      if (!refreshed) {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
      }
      user = refreshed;
    }

    if (user.twoFactorEmailEnabled) {
      await prisma.twoFactorCode.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });
      const six = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.twoFactorCode.create({
        data: { userId: user.id, code: six, expiresAt },
      });
      await sendTwoFactorCodeEmail(user.email, six);
      return NextResponse.json({
        ok: true,
        requiresTwoFactor: true,
        emailMasked: maskEmail(user.email),
      });
    }

    void recordPlatformEvent({
      eventType: "auth_login_success",
      sourceModule: "auth",
      entityType: "USER",
      entityId: user.id,
    }).catch(() => {});

    void trackEvent("login", { path: "/api/auth/login" }, { userId: user.id }).catch(() => {});

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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
