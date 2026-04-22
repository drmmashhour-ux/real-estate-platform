import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";
import { createReferralIfNeeded, ensureReferralCode, resolveReferralAttribution } from "@/lib/referrals";
import {
  checkRateLimitDistributed,
  getRateLimitHeadersFromResult,
  isIpRateLimitBlocked,
  maybeBlockIpAfterRateLimitDenied,
} from "@/lib/rate-limit-distributed";
import { sendAccountVerificationEmail, sendSignupEmail } from "@/lib/email/send";
import type { PlatformRole } from "@prisma/client";
import { getMortgagePlanDefaults } from "@/modules/mortgage/services/subscription-plans";
import { allocateUniqueUserCode } from "@/lib/user-code";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { trackConversionEvent } from "@/modules/conversion-engine/application/conversionTriggerService";
import { runFollowUpAutomation } from "@/modules/conversion-engine/application/followUpAutomationService";
import { runBnhubPostSignupAutomation } from "@/lib/bnhub/revenue-automation";
import { trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { recordGrowthEventWithFunnel } from "@/lib/growth/events";
import { onSignupAutomation } from "@/src/services/automation";
import { onMessagingTriggerSignup } from "@/src/modules/messaging/triggers";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { recordPlatformEvent } from "@/lib/observability";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import { fingerprintClientIp, getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { isSecurityIpBlocked } from "@/lib/security/ip-block";
import { isPublicSignupDisabled, maintenanceMessage } from "@/lib/security/kill-switches";
import { securityLog } from "@/lib/security/security-logger";
import { trackRepeatedSignupAttempt } from "@/lib/security/security-events";
import { buildSignupAttributionPayload } from "@/lib/attribution/signup-attribution";
import { recordTrafficEventServer } from "@/lib/traffic/record-server-event";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";
import { recordUserSignupConsents } from "@/lib/auth/user-consent";
import { logApi } from "@/lib/server/launch-logger";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

function appBaseUrl(): string {
  return getPublicAppUrl();
}

/** POST /api/auth/register — Create account; USER must verify email before session (see /auth/verify-email). */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    const ipFp = fingerprintClientIp(ip);
    const requestId = request.headers.get(REQUEST_ID_HEADER);
    if (await isSecurityIpBlocked(ipFp)) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (isPublicSignupDisabled()) {
      void securityLog({
        event: "signup_blocked_kill_switch",
        requestId,
        subjectHint: ipFp,
        persist: true,
        entityId: `fp:${ipFp}`,
      });
      return NextResponse.json(
        { error: maintenanceMessage() ?? "Registration is temporarily unavailable." },
        { status: 503 }
      );
    }
    if (await isIpRateLimitBlocked(ipFp)) {
      trackRepeatedSignupAttempt({ ipFingerprint: ipFp, requestId });
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
    }
    const limit = await checkRateLimitDistributed(`auth:register:${ip}`, { windowMs: 60 * 1000, max: 10 });
    if (!limit.allowed) {
      void maybeBlockIpAfterRateLimitDenied(ipFp);
      trackRepeatedSignupAttempt({ ipFingerprint: ipFp, requestId });
      return NextResponse.json(
        { error: "Too many signup attempts. Try again later." },
        { status: 429, headers: getRateLimitHeadersFromResult(limit) }
      );
    }
    const body = await request.json();
    const refCodeFromBody = typeof body?.ref === "string" ? body.ref.trim() : null;
    const refCodeFromQuery = request.nextUrl.searchParams.get("ref")?.trim() ?? null;
    const refCodeRaw = refCodeFromBody ?? refCodeFromQuery;
    const refKindFromBody =
      typeof body?.ref_kind === "string" ? body.ref_kind.trim().toUpperCase().slice(0, 24) : null;
    const refKindFromQuery =
      request.nextUrl.searchParams.get("ref_kind")?.trim().toUpperCase().slice(0, 24) ?? null;
    const refKind = refKindFromBody ?? refKindFromQuery;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = typeof body?.password === "string" ? body.password : null;
    const name = typeof body?.name === "string" ? body.name.trim() : null;
    const role = body?.role as PlatformRole | undefined;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    void recordPlatformEvent({
      eventType: "auth_signup_attempt",
      sourceModule: "auth",
      entityType: "AUTH",
      entityId: `fp:${ipFp}`,
      payload: {},
    }).catch(() => {});

    const acceptLegal =
      body?.acceptLegal === true ||
      body?.acceptedTerms === true ||
      body?.acceptTerms === true;
    if (!acceptLegal) {
      return NextResponse.json(
        {
          error:
            "You must agree to the Terms, Privacy Policy, and Platform Rules to create an account.",
        },
        { status: 400 }
      );
    }

    const validRole =
      role &&
      ["VISITOR", "USER", "CLIENT", "HOST", "BROKER", "MORTGAGE_EXPERT", "DEVELOPER", "ADMIN"].includes(
        role
      )
        ? role
        : "USER";

    if (validRole !== "MORTGAGE_EXPERT") {
      const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
      if (confirmPassword !== password) {
        return NextResponse.json({ error: "Password and confirmation do not match." }, { status: 400 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const phone =
      typeof body?.phone === "string" && body.phone.trim() ? body.phone.trim().slice(0, 32) : null;
    const company =
      typeof body?.company === "string" && body.company.trim()
        ? body.company.trim().slice(0, 160)
        : null;
    const licenseNumber =
      typeof body?.license === "string" && body.license.trim()
        ? body.license.trim().slice(0, 64)
        : null;

    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
    const derivedName = name || email.split("@")[0] || null;
    const signupAttributionJson = buildSignupAttributionPayload(
      request.headers.get("cookie"),
      body,
      request.nextUrl.searchParams.get("src"),
      request.nextUrl.search
    );

    const user =
      validRole === "MORTGAGE_EXPERT"
        ? await prisma.$transaction(async (tx) => {
            const userCode = await allocateUniqueUserCode(tx);
            const u = await tx.user.create({
              data: {
                userCode,
                email,
                passwordHash,
                name: name || null,
                phone,
                role: "MORTGAGE_EXPERT",
                emailVerifiedAt: new Date(),
                emailVerificationToken: null,
                emailVerificationExpires: null,
              },
            });
            const me = await tx.mortgageExpert.create({
              data: {
                userId: u.id,
                name: (name && name.trim()) || email.split("@")[0] || "Mortgage expert",
                email,
                phone,
                company,
                licenseNumber,
                title: "Mortgage expert",
                isActive: false,
                acceptedTerms: false,
                commissionRate: 0.3,
                expertVerificationStatus: "profile_incomplete",
              },
            });
            const plan = getMortgagePlanDefaults("basic");
            await tx.expertSubscription.create({
              data: {
                expertId: me.id,
                plan: "basic",
                price: plan.price,
                maxLeadsPerDay: plan.maxLeadsPerDay,
                maxLeadsPerMonth: plan.maxLeadsPerMonth,
                priorityWeight: plan.priorityWeight,
                isActive: false,
              },
            });
            return u;
          })
        : await prisma.$transaction(async (tx) => {
            const userCode = await allocateUniqueUserCode(tx);
            return tx.user.create({
              data: {
                userCode,
                email,
                passwordHash,
                name: derivedName,
                role: validRole,
                emailVerifiedAt: null,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires,
                ...(signupAttributionJson ? { signupAttributionJson } : {}),
              },
            });
          });

    const referralCode = await ensureReferralCode(user.id);
    void import("@/lib/fraud/compute-user-risk")
      .then((m) => m.evaluateUserFraudAfterSignup({ userId: user.id, ipFingerprint: ipFp }))
      .catch(() => {});
    void import("@/modules/fraud/fraud-engine.service")
      .then((m) =>
        m.evaluateLaunchFraudEngine(
          {
            user: {
              id: user.id,
              createdAt: user.createdAt,
              emailVerifiedAt: user.emailVerifiedAt,
            },
          },
          { persist: true, actionType: "signup_fraud_v1" }
        )
      )
      .catch(() => {});
    void trackEvent("signup", { role: validRole }, { userId: user.id }).catch(() => {});
    void persistLaunchEvent("USER_SIGNUP", {
      userId: user.id,
      role: validRole,
      ...(refCodeRaw ? { referralRef: refCodeRaw } : {}),
    });
    void recordGrowthEventWithFunnel("signup", {
      userId: user.id,
      metadata: { role: validRole, ...(refCodeRaw ? { referralRef: refCodeRaw } : {}) },
    });
    void onSignupAutomation(user.id).catch(() => {});
    void onMessagingTriggerSignup(user.id).catch(() => {});
    captureServerEvent(user.id, AnalyticsEvents.SIGNUP_COMPLETED, { role: validRole });
    await recordTrafficEventServer({
      eventType: "signup_completed",
      path: "/auth/signup",
      meta: { userId: user.id, role: validRole },
      sessionId: null,
      headers: request.headers,
      body,
    }).catch(() => {});
    if (validRole === "HOST") {
      await recordTrafficEventServer({
        eventType: "host_signup",
        path: "/auth/signup",
        meta: { userId: user.id },
        sessionId: null,
        headers: request.headers,
        body,
      }).catch(() => {});
      void recordGrowthEvent({
        eventName: GrowthEventName.HOST_SIGNUP,
        userId: user.id,
        idempotencyKey: `host_signup:${user.id}`,
        metadata: { role: validRole },
        cookieHeader: request.headers.get("cookie"),
        body,
      }).catch(() => {});
    }

    void recordGrowthEvent({
      eventName: GrowthEventName.SIGNUP_SUCCESS,
      userId: user.id,
      idempotencyKey: `signup_success:${user.id}`,
      metadata: { role: validRole },
      cookieHeader: request.headers.get("cookie"),
      body,
    }).catch(() => {});
    const tracked = await trackConversionEvent(prisma, { userId: user.id, event: "signup" }).catch(() => null);
    if (tracked?.triggers?.length) {
      await runFollowUpAutomation(prisma, { userId: user.id, triggers: tracked.triggers }).catch(() => {});
    }
    const attribution = refCodeRaw ? await resolveReferralAttribution(refCodeRaw).catch(() => null) : null;
    if (attribution) {
      await createReferralIfNeeded(attribution.publicCode, user.id, { inviteKind: refKind }).catch(() => {});
      await prisma.referralEvent
        .create({ data: { code: attribution.publicCode, eventType: "signup", userId: user.id } })
        .catch(() => {});
      void persistLaunchEvent("REFERRAL_SIGNUP", {
        referredUserId: user.id,
        referrerPublicCode: attribution.publicCode,
        ...(refKind ? { inviteKind: refKind } : {}),
      });
      void recordGrowthEventWithFunnel("referral_signup", {
        userId: user.id,
        metadata: { referrerPublicCode: attribution.publicCode, ...(refKind ? { inviteKind: refKind } : {}) },
      });
    }

    if (validRole !== "MORTGAGE_EXPERT") {
      void runBnhubPostSignupAutomation(user.id, user.role).catch(() => {});
    }

    if (validRole === "MORTGAGE_EXPERT") {
      sendSignupEmail(user.email, user.name).catch(() => {});
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
      res.headers.set("X-Referral-Code", referralCode);
      return res;
    }

    const verifyUrl = `${appBaseUrl()}/api/auth/verify-email-token?token=${encodeURIComponent(verificationToken)}`;
    sendAccountVerificationEmail(user.email, verifyUrl).catch(() => {});

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      needsEmailVerification: true,
    });
    res.headers.set("X-Referral-Code", referralCode);
    return res;
  } catch (e) {
    console.error(e);
    logApi.error("POST /api/auth/register failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
