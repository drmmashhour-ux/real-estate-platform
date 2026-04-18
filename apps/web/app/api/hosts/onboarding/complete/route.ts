import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { completeOnboarding, getOnboardingSession } from "@/modules/host-onboarding/onboarding.service";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";

const BodyZ = z.object({
  sessionId: z.string().min(8).max(64),
});

export const dynamic = "force-dynamic";

/** POST /api/hosts/onboarding/complete */
export async function POST(req: Request) {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const userId = await getGuestId();
  const existing = await getOnboardingSession(parsed.data.sessionId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
  }
  if (existing.userId && userId && existing.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const session = await completeOnboarding(parsed.data.sessionId);
    logHostFunnelEvent("onboarding_completed", { sessionId: session.id });
    void trackFunnelEvent("onboarding_completed", {});
    return NextResponse.json({ ok: true, session });
  } catch (e) {
    console.error("onboarding complete", e);
    return NextResponse.json({ ok: false, error: "Could not complete" }, { status: 500 });
  }
}
