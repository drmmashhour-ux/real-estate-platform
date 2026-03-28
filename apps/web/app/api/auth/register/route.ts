import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";
import { createReferralIfNeeded, ensureReferralCode } from "@/lib/referrals";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
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
import { onSignupAutomation } from "@/src/services/automation";
import { onMessagingTriggerSignup } from "@/src/modules/messaging/triggers";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** POST /api/auth/register — Create account; USER must verify email before session (see /auth/verify-email). */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous";
    const limit = checkRateLimit(`auth:register:${ip}`, { windowMs: 60 * 1000, max: 10 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
    const body = await request.json();
    const refCodeFromBody = typeof body?.ref === "string" ? body.ref.trim().toUpperCase() : null;
    const refCodeFromQuery = request.nextUrl.searchParams.get("ref")?.trim().toUpperCase() ?? null;
    const refCode = refCodeFromBody ?? refCodeFromQuery;
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
                isActive: true,
                acceptedTerms: false,
                commissionRate: 0.3,
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
                isActive: true,
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
              },
            });
          });

    const referralCode = await ensureReferralCode(user.id);
    void trackEvent("signup", { role: validRole }, { userId: user.id }).catch(() => {});
    void onSignupAutomation(user.id).catch(() => {});
    void onMessagingTriggerSignup(user.id).catch(() => {});
    captureServerEvent(user.id, AnalyticsEvents.SIGNUP_COMPLETED, { role: validRole });
    await prisma.trafficEvent
      .create({
        data: {
          eventType: "signup_completed",
          path: "/auth/signup",
          source: "auth",
          medium: "product",
          meta: { userId: user.id, role: validRole } as object,
        },
      })
      .catch(() => {});
    const tracked = await trackConversionEvent(prisma, { userId: user.id, event: "signup" }).catch(() => null);
    if (tracked?.triggers?.length) {
      await runFollowUpAutomation(prisma, { userId: user.id, triggers: tracked.triggers }).catch(() => {});
    }
    if (refCode) {
      await createReferralIfNeeded(refCode, user.id, { inviteKind: refKind }).catch(() => {});
      await prisma.referralEvent.create({ data: { code: refCode, eventType: "signup", userId: user.id } }).catch(() => {});
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
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
