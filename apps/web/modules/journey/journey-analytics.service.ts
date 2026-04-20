import type { JourneyAnalyticsRepository } from "./journey-analytics.repository";
import { createJourneyAnalyticsRepository } from "./journey-analytics.repository";
import type {
  JourneyAggregationWindow,
  JourneyHubPerformanceSummary,
  JourneySuggestionPerformanceSummary,
} from "./journey-analytics.types";
import { HUB_KEYS, type HubKey } from "./hub-journey.types";

function safeDiv(num: number, den: number): number {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return num / den;
}

function hubSummaryFromCounts(
  hub: HubKey,
  window: JourneyAggregationWindow,
  counts: Partial<Record<string, number>>,
  rawLowConfidenceShare: number,
): JourneyHubPerformanceSummary {
  const bannerViews = counts["journey_banner_viewed"] ?? 0;
  const nextClicks = counts["journey_next_clicked"] ?? 0;
  const suggestionViews = counts["journey_suggestion_viewed"] ?? 0;
  const suggestionClicks = counts["journey_suggestion_clicked"] ?? 0;
  const blockerViews = counts["journey_blocker_viewed"] ?? 0;
  const stepCompletedCount = counts["journey_step_completed"] ?? 0;
  const hubCompletedCount = counts["journey_hub_completed"] ?? 0;

  const suggestionCtr = safeDiv(suggestionClicks, suggestionViews || suggestionClicks);
  const hubCompletionRate = safeDiv(hubCompletedCount, bannerViews || hubCompletedCount);

  return {
    hub,
    window,
    bannerViews,
    nextClicks,
    suggestionViews,
    suggestionClicks,
    blockerViews,
    stepCompletedCount,
    hubCompletedCount,
    suggestionCtr,
    hubCompletionRate,
    topDropOffStepId: null,
    lowConfidenceEventShare: rawLowConfidenceShare,
  };
}

export async function getJourneyHubPerformanceSummary(
  hub: HubKey,
  window: JourneyAggregationWindow,
  repo: JourneyAnalyticsRepository = createJourneyAnalyticsRepository(),
): Promise<JourneyHubPerformanceSummary> {
  try {
    const byHub = repo.getJourneyEventCountsByHub(window);
    const slot = byHub[hub] ?? {};
    const raw = repo.getRawEvents(window, hub);
    let low = 0;
    let total = 0;
    for (const e of raw) {
      total += 1;
      if (e.confidence === "low") low += 1;
    }
    const lowShare = total > 0 ? low / total : 0;

    const steps = repo.getJourneyStepPerformance(hub, window);
    let topDropOffStepId: string | null = null;
    let worst = 1;
    for (const s of steps) {
      const drop = 1 - s.completionRate;
      if (s.views > 0 && drop >= worst) {
        worst = drop;
        topDropOffStepId = s.stepId;
      }
    }

    const base = hubSummaryFromCounts(hub, window, slot as Record<string, number>, lowShare);
    return { ...base, topDropOffStepId };
  } catch {
    return hubSummaryFromCounts(hub, window, {}, 0);
  }
}

export async function getJourneyPortfolioPerformanceSummary(
  window: JourneyAggregationWindow,
  repo: JourneyAnalyticsRepository = createJourneyAnalyticsRepository(),
): Promise<JourneyHubPerformanceSummary[]> {
  try {
    const out: JourneyHubPerformanceSummary[] = [];
    for (const h of HUB_KEYS) {
      out.push(await getJourneyHubPerformanceSummary(h, window, repo));
    }
    return out;
  } catch {
    return HUB_KEYS.map((h) => hubSummaryFromCounts(h, window, {}, 0));
  }
}

export async function getJourneySuggestionEffectivenessSummary(
  hub: HubKey,
  window: JourneyAggregationWindow,
  repo: JourneyAnalyticsRepository = createJourneyAnalyticsRepository(),
): Promise<JourneySuggestionPerformanceSummary[]> {
  try {
    return repo.getJourneySuggestionPerformance(hub, window);
  } catch {
    return [];
  }
}

export async function getJourneyBlockerImpactSummary(
  hub: HubKey,
  window: JourneyAggregationWindow,
  repo: JourneyAnalyticsRepository = createJourneyAnalyticsRepository(),
): Promise<{ label: string; views: number }[]> {
  try {
    return repo.getJourneyTopBlockers(hub, window);
  } catch {
    return [];
  }
}

export async function getJourneyAttributionSummary(
  hub: HubKey,
  window: JourneyAggregationWindow,
  repo: JourneyAnalyticsRepository = createJourneyAnalyticsRepository(),
): Promise<import("./journey-analytics.types").JourneyOutcomeAttributionSummary> {
  try {
    const journeyTouch = repo.getRawEvents(window, hub);
    const funnel = await repo.getJourneyOutcomeAttribution(hub, window);
    const bannerViews = journeyTouch.filter((e) => e.eventName === "journey_banner_viewed").length;
    const sessionsProxy = new Set(journeyTouch.map((e) => `${e.locale}:${e.country}:${e.actorType}`)).size;
    const totalOutcomes =
      funnel.bookingStartsPlatform +
      funnel.contactClicksPlatform +
      funnel.landingVisitsPlatform +
      funnel.listingClickPlatform +
      funnel.dealsStartedPlatform;
    const touches = journeyTouch.length;
    const attributedShareUpperBound =
      totalOutcomes > 0 && touches > 0 ? Math.min(1, touches / (touches + totalOutcomes)) : null;

    return {
      hub,
      window,
      methodology: "last_touch_proxy",
      disclaimer:
        "Attribution summarizes co-temporal platform funnel counts with journey engagement volume; not proof of causation.",
      platformOutcomeCounts: {
        booking_started: funnel.bookingStartsPlatform,
        landing_visit: funnel.landingVisitsPlatform,
        contact_click: funnel.contactClicksPlatform,
        listing_click: funnel.listingClickPlatform,
        deal_started: funnel.dealsStartedPlatform,
      },
      journeyTouchCounts: {
        bannerViews,
        uniqueSessionsProxy: sessionsProxy,
      },
      attributedShareUpperBound,
    };
  } catch {
    return {
      hub,
      window,
      methodology: "last_touch_proxy",
      disclaimer: "No attribution data available.",
      platformOutcomeCounts: {},
      journeyTouchCounts: { bannerViews: 0, uniqueSessionsProxy: 0 },
      attributedShareUpperBound: null,
    };
  }
}
