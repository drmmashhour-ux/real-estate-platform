import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { engineFlags } from "@/config/feature-flags";
import { buildHubJourneyContextFromDb } from "@/modules/journey/hub-journey-context.builder";
import { buildHubCopilotState } from "@/modules/journey/hub-copilot.service";
import { buildHubJourneyPlan } from "@/modules/journey/hub-journey-state.service";
import { isHubKey } from "@/modules/journey/hub-journey.types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ hub: string }> },
) {
  try {
    const { hub: hubParam } = await context.params;
    if (!isHubKey(hubParam)) {
      return NextResponse.json({ error: "Invalid hub" }, { status: 400 });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") ?? "en";
    const country = url.searchParams.get("country") ?? "ca";

    const guestId = await getGuestId().catch(() => null);

    const journeyEnabled = engineFlags.hubJourneyV1;
    const copilotEnabled = engineFlags.hubCopilotV1;

    if (!journeyEnabled && !copilotEnabled) {
      return NextResponse.json({
        disabled: true,
        plan: null,
        copilot: null,
      });
    }

    const ctx = await buildHubJourneyContextFromDb({
      hub: hubParam,
      userId: guestId,
      locale,
      country,
    });

    const plan = journeyEnabled ? buildHubJourneyPlan(hubParam, ctx) : null;
    const copilot = copilotEnabled ? buildHubCopilotState(hubParam, ctx, plan ?? undefined) : null;

    return NextResponse.json({
      plan,
      copilot: copilotEnabled ? copilot : null,
      flags: { journey: journeyEnabled, copilot: copilotEnabled },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Journey unavailable", detail: String(e) },
      { status: 500 },
    );
  }
}
