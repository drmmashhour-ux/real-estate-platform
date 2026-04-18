import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { onboardingStepSchema } from "@/modules/host-onboarding/onboarding.validation";
import { saveOnboardingStep } from "@/modules/host-onboarding/onboarding.service";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";

export const dynamic = "force-dynamic";

/** POST /api/hosts/onboarding/step */
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

  const parsed = onboardingStepSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const userId = await getGuestId();
  try {
    const updated = await saveOnboardingStep(parsed.data);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }
    if (userId && updated.userId && updated.userId !== userId) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    logHostFunnelEvent("onboarding_step_completed", { step: parsed.data.stepKey });
    void trackFunnelEvent("onboarding_step_completed", { step: parsed.data.stepKey });
    return NextResponse.json({ ok: true, session: updated });
  } catch (e) {
    console.error("onboarding step", e);
    return NextResponse.json({ ok: false, error: "Could not save step" }, { status: 500 });
  }
}
