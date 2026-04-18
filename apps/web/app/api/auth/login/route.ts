import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkRateLimitDistributed,
  getRateLimitHeadersFromResult,
  isIpRateLimitBlocked,
  maybeBlockIpAfterRateLimitDenied,
} from "@/lib/rate-limit-distributed";
import { isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";
import { recordPlatformEvent } from "@/lib/observability";
import { allocateUniqueUserCode } from "@/lib/user-code";
import { sendTwoFactorCodeEmail } from "@/lib/email/send";
import { applyLoginSessionCookies } from "@/lib/auth/apply-login-session";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { isTestMode } from "@/lib/config/app-mode";
import { logSecurityEvent } from "@/lib/observability/security-events";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import { fingerprintClientIp, getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { isSecurityIpBlocked } from "@/lib/security/ip-block";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";

function maskEmail(email: string): string {
  const [a, d] = email.split("@");
  if (!a || !d) return "***";
  const show = a.slice(0, Math.min(2, a.length));
  return `${show}***@${d}`;
}

/** POST /api/auth/login — Authenticate and set session. */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    const ipFp = fingerprintClientIp(ip);
    const requestId = request.headers.get(REQUEST_ID_HEADER);
    if (await isSecurityIpBlocked(ipFp)) {
      logSecurityEvent({
        event: "suspicious_request",
        detail: "blocked_ip_security_list",
        subjectHint: ipFp,
        requestId,
      });
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (await isIpRateLimitBlocked(ipFp)) {
      logSecurityEvent({
        event: "rate_limit_exceeded",
        detail: "blocked_ip_auth_login",
        subjectHint: ipFp,
        requestId,
      });
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const rateKey = `auth:login:${ip}`;
    const limit = await checkRateLimitDistributed(rateKey, { windowMs: 60 * 1000, max: 20 });
    if (!limit.allowed) {
      void maybeBlockIpAfterRateLimitDenied(ipFp);
      logSecurityEvent({
        event: "rate_limit_exceeded",
        detail: "auth_login",
        subjectHint: ipFp,
        requestId,
      });
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: getRateLimitHeadersFromResult(limit) }
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const raw = body as Record<string, unknown>;
    const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : null;
    const password = typeof raw.password === "string" ? raw.password : null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    void recordPlatformEvent({
      eventType: "auth_login_attempt",
      sourceModule: "auth",
      entityType: "AUTH",
      entityId: `fp:${ipFp}`,
      payload: {},
    }).catch(() => {});

    const prodLike = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    if (prodLike && process.env.ALLOW_SEED_ADMIN_LOGIN !== "1" && email === "admin@test.com") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logSecurityEvent({
        event: "auth_login_failure",
        detail: "unknown_user",
        subjectHint: ipFp,
        requestId,
      });
      void recordPlatformEvent({
        eventType: "auth_login_failure",
        sourceModule: "auth",
        entityType: "AUTH",
        entityId: `fp:${ipFp}`,
        payload: { reason: "unknown_user" },
      }).catch(() => {});
      void import("@/lib/fraud/compute-user-risk")
        .then((m) => m.evaluateUserFraudAfterFailedLogin({ ipFingerprint: ipFp }))
        .catch(() => {});
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.passwordHash) {
      const hint = isDemoAuthAllowed()
        ? "Account has no password yet; use BNHUB demo sign-in in development or set a password via support."
        : "Account has no password set. Use password reset or contact support to activate password login.";
      return NextResponse.json({ error: hint }, { status: 400 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const failedLoginUserId = user.id;
      logSecurityEvent({
        event: "auth_login_failure",
        detail: "invalid_password",
        subjectHint: ipFp,
        requestId,
      });
      void recordPlatformEvent({
        eventType: "auth_login_failure",
        sourceModule: "auth",
        entityType: "AUTH",
        entityId: `fp:${ipFp}`,
        payload: { reason: "invalid_password" },
      }).catch(() => {});
      void import("@/lib/fraud/compute-user-risk")
        .then((m) => m.evaluateUserFraudAfterFailedLogin({ userId: failedLoginUserId, ipFingerprint: ipFp }))
        .catch(() => {});
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerifiedAt && !(isTestMode() && email.endsWith("@test.com"))) {
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
    void recordGrowthEvent({
      eventName: GrowthEventName.LOGIN,
      userId: user.id,
      cookieHeader: request.headers.get("cookie"),
      body: undefined,
      referrerHeader: request.headers.get("referer"),
    }).catch(() => {});
    void persistLaunchEvent("USER_LOGIN", { userId: user.id, role: user.role });

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
