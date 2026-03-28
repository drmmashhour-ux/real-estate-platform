import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie } from "@/lib/auth/session";
import { ensureReferralCode } from "@/lib/referrals";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { sendSignupEmail } from "@/lib/email/send";
import { defaultMortgageTrialEndsAt } from "@/modules/mortgage/services/mortgage-trial";

export const dynamic = "force-dynamic";

/** POST — mortgage broker account + `MortgageBroker` row (profile completed on next step). */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "anonymous";
    const limit = checkRateLimit(`auth:register-mb:${ip}`, { windowMs: 60 * 1000, max: 8 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = typeof body?.password === "string" ? body.password : null;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

    const acceptLegal =
      body?.acceptLegal === true ||
      body?.acceptedTerms === true ||
      body?.acceptTerms === true;
    if (!acceptLegal) {
      return NextResponse.json(
        { error: "You must agree to the Terms, Privacy Policy, and Platform Rules to create an account." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const emailUsedByBroker = await prisma.mortgageBroker.findFirst({
      where: { email },
      select: { id: true },
    });
    if (emailUsedByBroker) {
      return NextResponse.json(
        { error: "This email is already used for a mortgage broker on the platform. Use a different email or sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: fullName,
          role: "USER",
        },
      });
      await tx.mortgageBroker.create({
        data: {
          userId: u.id,
          name: fullName,
          fullName,
          email,
          phone: null,
          company: null,
          plan: "trial",
          trialEndsAt: defaultMortgageTrialEndsAt(),
          licenseNumber: "",
          isVerified: false,
          verificationStatus: "pending",
        },
      });
      return u;
    });

    const referralCode = await ensureReferralCode(user.id);
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
    res.headers.set("X-Referral-Code", referralCode);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
