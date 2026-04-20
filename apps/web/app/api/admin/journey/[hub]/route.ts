import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { buildJourneyHubAdminPanel } from "@/modules/journey/journey-admin-dashboard.service";
import { parseAggregationWindow } from "@/modules/journey/journey-analytics.window";
import { isHubKey } from "@/modules/journey/hub-journey.types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ hub: string }> },
) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { hub: hubParam } = await ctx.params;
  const window = parseAggregationWindow(req.nextUrl.searchParams.get("window"));

  if (!isHubKey(hubParam)) {
    return NextResponse.json({
      hub: hubParam,
      performance: null,
      steps: [],
      suggestions: [],
      blockers: [],
      attribution: null,
      confidence: null,
      freshness: null,
      flags: { dashboard: false },
      error: "unsupported_hub",
    });
  }

  if (!engineFlags.hubJourneyAnalyticsDashboardV1) {
    return NextResponse.json({
      hub: hubParam,
      performance: null,
      steps: [],
      suggestions: [],
      blockers: [],
      attribution: null,
      confidence: null,
      freshness: null,
      flags: {
        hubJourney: engineFlags.hubJourneyV1,
        dashboard: false,
      },
    });
  }

  try {
    const panel = await buildJourneyHubAdminPanel(hubParam, window);
    return NextResponse.json({
      hub: hubParam,
      performance: panel.performance,
      steps: [],
      suggestions: panel.suggestions,
      blockers: panel.blockers,
      attribution: panel.attribution,
      confidence: {
        lowConfidenceHubs: panel.lowConfidenceHubs,
        hubShare: panel.performance.lowConfidenceEventShare,
      },
      freshness: panel.freshness,
      flags: panel.flags,
      exploratoryAttribution: panel.exploratoryAttribution,
    });
  } catch {
    return NextResponse.json({
      hub: hubParam,
      performance: null,
      steps: [],
      suggestions: [],
      blockers: [],
      attribution: null,
      confidence: null,
      freshness: { journeyEventSource: "error", availabilityNote: "Read failed." },
      flags: { dashboard: engineFlags.hubJourneyAnalyticsDashboardV1 },
    });
  }
}
