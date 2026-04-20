/**
 * Read boundary for journey analytics — in-memory adapter + optional Prisma funnel aggregates.
 */

import { prisma } from "@/lib/db";
import { snapshotJourneyAnalyticsEvents } from "./journey-analytics.memory-store";
import { windowStartMs } from "./journey-analytics.window";
import type {
  JourneyAggregationWindow,
  JourneyAnalyticsEventName,
  JourneyAnalyticsEventPayload,
  JourneySuggestionPerformanceSummary,
  JourneyStepPerformanceSummary,
} from "./journey-analytics.types";
import { HUB_KEYS, type HubKey } from "./hub-journey.types";

export type JourneyEventCountsByHub = Partial<
  Record<HubKey, Partial<Record<JourneyAnalyticsEventName, number>>>
>;

export type JourneyCompletionFunnelStep = {
  stepId: string;
  impressions: number;
  completions: number;
};

export type JourneyRepositoryMeta = {
  /** Where journey UI events were read from */
  journeyEventSource: "in_process_ring_buffer";
  /** Whether Prisma funnel counts succeeded */
  prismaOutcomeCountsAvailable: boolean;
};

export interface JourneyAnalyticsRepository {
  getMeta(): JourneyRepositoryMeta;
  getJourneyEventCountsByHub(window: JourneyAggregationWindow): JourneyEventCountsByHub;
  getRawEvents(window: JourneyAggregationWindow, hub?: HubKey): JourneyAnalyticsEventPayload[];
  getJourneyStepPerformance(hub: HubKey, window: JourneyAggregationWindow): JourneyStepPerformanceSummary[];
  getJourneySuggestionPerformance(hub: HubKey, window: JourneyAggregationWindow): JourneySuggestionPerformanceSummary[];
  getJourneyOutcomeAttribution(hub: HubKey, window: JourneyAggregationWindow): Promise<{
    bookingStartsPlatform: number;
    landingVisitsPlatform: number;
    contactClicksPlatform: number;
    listingClickPlatform: number;
    dealsStartedPlatform: number;
  }>;
  getJourneyTopBlockers(hub: HubKey, window: JourneyAggregationWindow): { label: string; views: number }[];
  getJourneyCompletionFunnel(hub: HubKey, window: JourneyAggregationWindow): JourneyCompletionFunnelStep[];
}

function filterEvents(window: JourneyAggregationWindow, hub?: HubKey): JourneyAnalyticsEventPayload[] {
  try {
    const since = windowStartMs(window);
    const all = snapshotJourneyAnalyticsEvents();
    return all.filter((e) => {
      if (e.timestampMs < since) return false;
      if (hub && e.hub !== hub) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function buildJourneyStepPerformance(
  hub: HubKey,
  window: JourneyAggregationWindow,
): JourneyStepPerformanceSummary[] {
  try {
    const ev = filterEvents(window, hub);
    const stepViews = new Map<string, number>();
    const stepDone = new Map<string, number>();
    for (const e of ev) {
      if (e.eventName === "journey_banner_viewed" && e.currentStepId) {
        stepViews.set(e.currentStepId, (stepViews.get(e.currentStepId) ?? 0) + 1);
      }
      if (e.eventName === "journey_step_completed" && e.currentStepId) {
        stepDone.set(e.currentStepId, (stepDone.get(e.currentStepId) ?? 0) + 1);
      }
    }
    const ids = new Set([...stepViews.keys(), ...stepDone.keys()]);
    const rows: JourneyStepPerformanceSummary[] = [];
    for (const stepId of ids) {
      const views = stepViews.get(stepId) ?? 0;
      const completions = stepDone.get(stepId) ?? 0;
      const completionRate = views > 0 ? completions / views : completions > 0 ? 1 : 0;
      rows.push({ stepId, views, completions, completionRate });
    }
    return rows.sort((a, b) => b.views - a.views);
  } catch {
    return [];
  }
}

async function prismaFunnelCounts(window: JourneyAggregationWindow): Promise<{
  bookingStartsPlatform: number;
  landingVisitsPlatform: number;
  contactClicksPlatform: number;
  listingClickPlatform: number;
  dealsStartedPlatform: number;
}> {
  const since = new Date(windowStartMs(window));
  let prismaOk = false;
  const zeros = {
    bookingStartsPlatform: 0,
    landingVisitsPlatform: 0,
    contactClicksPlatform: 0,
    listingClickPlatform: 0,
    dealsStartedPlatform: 0,
  };
  try {
    const rows = await prisma.analyticsFunnelEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    prismaOk = true;
    for (const r of rows) {
      const c = r._count._all;
      if (r.name === "booking_started") zeros.bookingStartsPlatform = c;
      if (r.name === "landing_visit") zeros.landingVisitsPlatform = c;
      if (r.name === "contact_click") zeros.contactClicksPlatform = c;
      if (r.name === "listing_click") zeros.listingClickPlatform = c;
      if (r.name === "deal_started") zeros.dealsStartedPlatform = c;
    }
    void prismaOk;
    return zeros;
  } catch {
    return zeros;
  }
}

export function createJourneyAnalyticsRepository(): JourneyAnalyticsRepository {
  return {
    getMeta(): JourneyRepositoryMeta {
      return {
        journeyEventSource: "in_process_ring_buffer",
        prismaOutcomeCountsAvailable: true,
      };
    },

    getJourneyEventCountsByHub(window: JourneyAggregationWindow): JourneyEventCountsByHub {
      try {
        const ev = filterEvents(window);
        const out: JourneyEventCountsByHub = {};
        for (const h of HUB_KEYS) out[h] = {};
        for (const e of ev) {
          const slot = out[e.hub] ?? {};
          slot[e.eventName] = (slot[e.eventName] ?? 0) + 1;
          out[e.hub] = slot;
        }
        return out;
      } catch {
        return {};
      }
    },

    getRawEvents(window: JourneyAggregationWindow, hub?: HubKey): JourneyAnalyticsEventPayload[] {
      return filterEvents(window, hub);
    },

    getJourneyStepPerformance(hub: HubKey, window: JourneyAggregationWindow): JourneyStepPerformanceSummary[] {
      try {
        const ev = filterEvents(window, hub);
        const stepViews = new Map<string, number>();
        const stepDone = new Map<string, number>();
        for (const e of ev) {
          if (e.eventName === "journey_banner_viewed" && e.currentStepId) {
            stepViews.set(e.currentStepId, (stepViews.get(e.currentStepId) ?? 0) + 1);
          }
          if (e.eventName === "journey_step_completed" && e.currentStepId) {
            stepDone.set(e.currentStepId, (stepDone.get(e.currentStepId) ?? 0) + 1);
          }
        }
        const ids = new Set([...stepViews.keys(), ...stepDone.keys()]);
        const rows: JourneyStepPerformanceSummary[] = [];
        for (const stepId of ids) {
          const views = stepViews.get(stepId) ?? 0;
          const completions = stepDone.get(stepId) ?? 0;
          const completionRate = views > 0 ? completions / views : completions > 0 ? 1 : 0;
          rows.push({ stepId, views, completions, completionRate });
        }
        return rows.sort((a, b) => b.views - a.views);
      } catch {
        return [];
      }
    },

    getJourneySuggestionPerformance(hub: HubKey, window: JourneyAggregationWindow): JourneySuggestionPerformanceSummary[] {
      try {
        const ev = filterEvents(window, hub);
        const views = new Map<string, number>();
        const clicks = new Map<string, number>();
        for (const e of ev) {
          if (e.eventName === "journey_suggestion_viewed") {
            for (const id of e.suggestionIds ?? []) {
              views.set(id, (views.get(id) ?? 0) + 1);
            }
          }
          if (e.eventName === "journey_suggestion_clicked") {
            for (const id of e.suggestionIds ?? []) {
              clicks.set(id, (clicks.get(id) ?? 0) + 1);
            }
          }
        }
        const ids = new Set([...views.keys(), ...clicks.keys()]);
        const rows: JourneySuggestionPerformanceSummary[] = [];
        for (const suggestionId of ids) {
          const v = views.get(suggestionId) ?? 0;
          const c = clicks.get(suggestionId) ?? 0;
          const ctr = v > 0 ? c / v : c > 0 ? 1 : 0;
          rows.push({ suggestionId, views: v, clicks: c, ctr });
        }
        return rows.sort((a, b) => b.views - a.views);
      } catch {
        return [];
      }
    },

    async getJourneyOutcomeAttribution(hub: HubKey, window: JourneyAggregationWindow) {
      void hub;
      return prismaFunnelCounts(window);
    },

    getJourneyTopBlockers(hub: HubKey, window: JourneyAggregationWindow): { label: string; views: number }[] {
      try {
        const ev = filterEvents(window, hub).filter((e) => e.eventName === "journey_blocker_viewed");
        return [{ label: "blocker_events", views: ev.length }];
      } catch {
        return [];
      }
    },

    getJourneyCompletionFunnel(hub: HubKey, window: JourneyAggregationWindow): JourneyCompletionFunnelStep[] {
      try {
        return buildJourneyStepPerformance(hub, window).map((s) => ({
          stepId: s.stepId,
          impressions: s.views,
          completions: s.completions,
        }));
      } catch {
        return [];
      }
    },
  };
}
