import { getLegacyDB } from "@/lib/db/legacy";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getExperimentVariant, HERO_CTA_EXPERIMENT_KEY, trackExperimentEvent } from "@/lib/experiments/engine";
import { flags } from "@/lib/flags";
import { clearReferralCodeCookieHeader } from "@/lib/growth/referral-cookie-server";
import { trackReferral } from "@/lib/growth/referral";
import { REFERRAL_CODE_COOKIE } from "@/lib/growth/referral-constants";

const prisma = getLegacyDB();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
      },
    });

    const regUrl = new URL(req.url);
    const refFromRegisterUrl = regUrl.searchParams.get("ref")?.trim() ?? null;
    const refCookie = (await cookies()).get(REFERRAL_CODE_COOKIE)?.value?.trim() ?? null;
    /** Prefer HTTP-only first-touch; allow `?ref=` on the register request as a fallback. */
    const ref = refCookie ?? refFromRegisterUrl;
    if (ref) {
      try {
        await trackReferral(ref, user.id);
      } catch {
        /* best-effort attribution */
      }
    }

    if (flags.RECOMMENDATIONS) {
      try {
        await getExperimentVariant(user.id, HERO_CTA_EXPERIMENT_KEY);
        await trackExperimentEvent(user.id, HERO_CTA_EXPERIMENT_KEY, "signup_completed");
      } catch {
        /* non-blocking experiment funnel */
      }
    }

    return NextResponse.json(
      { id: user.id, email: user.email },
      { headers: ref ? { "Set-Cookie": clearReferralCodeCookieHeader() } : undefined }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return Response.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}
