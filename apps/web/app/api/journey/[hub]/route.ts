import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { engineFlags } from "@/config/feature-flags";
import { buildHubJourneyContextFromDb } from "@/modules/journey/hub-journey-context.builder";
import { buildHubCopilotState } from "@/modules/journey/hub-copilot.service";
import { isHubJourneyRolloutEnabled } from "@/modules/journey/hub-journey-rollout";
import { buildHubJourneyPlan } from "@/modules/journey/hub-journey-state.service";
import { logJourneyStructuredKind } from "@/modules/journey/hub-journey-monitoring.service";
import { isHubKey } from "@/modules/journey/hub-journey.types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ hub: string }> },
) {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const { hub: hubParam } = await context.params;
    if (!isHubKey(hubParam)) {
      return NextResponse.json({ error: "Invalid hub" }, { status: 400 });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") ?? "en";
    const country = url.searchParams.get("country") ?? "ca";

    const journeyEnabled = engineFlags.hubJourneyV1;
    const copilotEnabled = engineFlags.hubCopilotV1;
    const analyticsEnabled = engineFlags.hubJourneyAnalyticsV1;
    const hubRollout = isHubJourneyRolloutEnabled(hubParam);

    if (!hubRollout) {
      return NextResponse.json({
        disabled: true,
        rollout: true,
        plan: null,
        copilot: null,
        flags: {
          journey: journeyEnabled,
          copilot: copilotEnabled,
          analytics: analyticsEnabled,
          hubRollout: false,
        },
      });
    }

    if (!journeyEnabled && !copilotEnabled) {
      return NextResponse.json({
        disabled: true,
        plan: null,
        copilot: null,
        flags: {
          journey: journeyEnabled,
          copilot: copilotEnabled,
          analytics: analyticsEnabled,
          hubRollout: true,
        },
      });
    }

    const guestId = await getGuestId().catch(() => null);

    const ctx = await buildHubJourneyContextFromDb({
      hub: hubParam,
      userId: guestId,
      locale,
      country,
    });

    const plan = journeyEnabled ? buildHubJourneyPlan(hubParam, ctx) : null;
    const copilot = copilotEnabled ? buildHubCopilotState(hubParam, ctx, plan ?? undefined) : null;

    try {
      logJourneyStructuredKind("api_resolved", {
        hub: hubParam,
        locale,
        country,
        progress: plan?.progressPercent,
        blockerCount: copilot?.blockers.length ?? 0,
        confidence: plan?.signalConfidence,
        route: url.pathname,
        flags: {
          journey: journeyEnabled,
          copilot: copilotEnabled,
          analytics: analyticsEnabled,
        },
      });
    } catch {
      /* noop */
    }

    return NextResponse.json({
      disabled: false,
      plan,
      copilot: copilotEnabled ? copilot : null,
      flags: {
        journey: journeyEnabled,
        copilot: copilotEnabled,
        analytics: analyticsEnabled,
        hubRollout: true,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Journey unavailable",
        ...(isProd ? {} : { detail: String(e) }),
      },
      { status: 500 },
    );
  }
}
