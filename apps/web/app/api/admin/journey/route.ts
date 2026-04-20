import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import {
  getJourneyAttributionSummary,
  getJourneyBlockerImpactSummary,
  getJourneyPortfolioPerformanceSummary,
} from "@/modules/journey/journey-analytics.service";
import { parseAggregationWindow } from "@/modules/journey/journey-analytics.window";
import { createJourneyAnalyticsRepository } from "@/modules/journey/journey-analytics.repository";
import { HUB_KEYS } from "@/modules/journey/hub-journey.types";

export const dynamic = "force-dynamic";

function portfolioRollup(
  rows: Awaited<ReturnType<typeof getJourneyPortfolioPerformanceSummary>>,
) {
  const z = {
    bannerViews: 0,
    nextClicks: 0,
    suggestionViews: 0,
    suggestionClicks: 0,
    blockerViews: 0,
    hubCompletions: 0,
  };
  for (const r of rows) {
    z.bannerViews += r.bannerViews;
    z.nextClicks += r.nextClicks;
    z.suggestionViews += r.suggestionViews;
    z.suggestionClicks += r.suggestionClicks;
    z.blockerViews += r.blockerViews;
    z.hubCompletions += r.hubCompletedCount;
  }
  return z;
}

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const window = parseAggregationWindow(req.nextUrl.searchParams.get("window"));

  if (!engineFlags.hubJourneyAnalyticsDashboardV1) {
    return NextResponse.json({
      disabled: true,
      summary: null,
      hubs: [],
      blockers: {},
      attribution: {},
      freshness: null,
      flags: {
        hubJourney: engineFlags.hubJourneyV1,
        dashboard: false,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    });
  }

  try {
    const repo = createJourneyAnalyticsRepository();
    const meta = repo.getMeta();
    const portfolio = await getJourneyPortfolioPerformanceSummary(window, repo);
    const summary = portfolioRollup(portfolio);

    const blockers: Record<string, Awaited<ReturnType<typeof getJourneyBlockerImpactSummary>>> = {};
    const attribution: Record<string, Awaited<ReturnType<typeof getJourneyAttributionSummary>>> = {};
    for (const h of HUB_KEYS) {
      blockers[h] = await getJourneyBlockerImpactSummary(h, window, repo);
      if (engineFlags.hubJourneyAttributionV1) {
        attribution[h] = await getJourneyAttributionSummary(h, window, repo);
      }
    }

    return NextResponse.json({
      disabled: false,
      summary,
      hubs: portfolio,
      blockers,
      attribution: engineFlags.hubJourneyAttributionV1 ? attribution : {},
      freshness: {
        journeyEventSource: meta.journeyEventSource,
        availabilityNote:
          "Aggregated journey UI counts are in-process per runtime; funnel totals use Prisma `analytics_events` where available.",
      },
      flags: {
        hubJourney: engineFlags.hubJourneyV1,
        analytics: engineFlags.hubJourneyAnalyticsV1,
        dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    });
  } catch {
    return NextResponse.json(
      {
        disabled: false,
        summary: null,
        hubs: [],
        blockers: {},
        attribution: {},
        freshness: { journeyEventSource: "error", availabilityNote: "Read failed — empty response." },
        flags: {
          hubJourney: engineFlags.hubJourneyV1,
          analytics: engineFlags.hubJourneyAnalyticsV1,
          dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
          attribution: engineFlags.hubJourneyAttributionV1,
          feedback: engineFlags.hubJourneyFeedbackV1,
        },
      },
      { status: 200 },
    );
  }
}
