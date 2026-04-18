import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { startOnboardingSession } from "@/modules/host-onboarding/onboarding.service";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";

const BodyZ = z.object({
  leadId: z.string().optional(),
});

export const dynamic = "force-dynamic";

/** POST /api/hosts/onboarding/start */
export async function POST(req: Request) {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const userId = await getGuestId();
  try {
    const session = await startOnboardingSession({
      leadId: parsed.data.leadId ?? null,
      userId: userId ?? null,
    });
    logHostFunnelEvent("onboarding_started", { sessionId: session.id });
    void trackFunnelEvent("onboarding_started", {});
    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (e) {
    console.error("onboarding start", e);
    return NextResponse.json({ ok: false, error: "Could not start session" }, { status: 500 });
  }
}
