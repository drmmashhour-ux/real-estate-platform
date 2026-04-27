import { NextResponse } from "next/server";

import { getPersonalizedContent } from "@/lib/ai/personalizationEngine";
import { getUserProfile } from "@/lib/ai/userProfile";
import { flags } from "@/lib/flags";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/user-profile — read-only user behavior profile (debug / QA; no PII in shapes beyond opaque id).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.RECOMMENDATIONS) {
    return NextResponse.json({
      enabled: false,
      profile: null,
      personalized: null,
      message: "FEATURE_RECO is off",
    });
  }
  try {
    const userId = await getGuestId();
    const profile = await getUserProfile(userId ?? undefined);
    const personalized = getPersonalizedContent(profile);
    return NextResponse.json({ enabled: true, userId: profile.userId ?? null, profile, personalized });
  } catch (e) {
    logError(e, { route: "/api/ai/user-profile" });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
