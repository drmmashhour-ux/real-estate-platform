import { engineFlags } from "@/config/feature-flags";
import {
  getJourneyAttributionSummary,
  getJourneyBlockerImpactSummary,
  getJourneyHubPerformanceSummary,
  getJourneyPortfolioPerformanceSummary,
  getJourneySuggestionEffectivenessSummary,
} from "./journey-analytics.service";
import { buildJourneyOutcomeAttribution } from "./journey-attribution.service";
import { createJourneyAnalyticsRepository } from "./journey-analytics.repository";
import type { JourneyAggregationWindow, JourneyStepPerformanceSummary } from "./journey-analytics.types";
import type { HubKey } from "./hub-journey.types";

export type JourneyAdminFreshness = {
  journeyEventSource: string;
  /** Human-readable caveat */
  availabilityNote: string;
};

export async function buildJourneyAdminDashboard(window: JourneyAggregationWindow): Promise<{
  portfolio: Awaited<ReturnType<typeof getJourneyPortfolioPerformanceSummary>>;
  freshness: JourneyAdminFreshness;
  flags: {
    dashboard: boolean;
    attribution: boolean;
    feedback: boolean;
  };
}> {
  try {
    const repo = createJourneyAnalyticsRepository();
    const meta = repo.getMeta();
    const portfolio = await getJourneyPortfolioPerformanceSummary(window, repo);
    return {
      portfolio,
      freshness: {
        journeyEventSource: meta.journeyEventSource,
        availabilityNote:
          "Journey UI events persist in-process only until a durable analytics sink is enabled; funnel counts use Prisma `analytics_events` aggregates.",
      },
      flags: {
        dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    };
  } catch {
    return {
      portfolio: [],
      freshness: {
        journeyEventSource: "unknown",
        availabilityNote: "Dashboard unavailable.",
      },
      flags: {
        dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    };
  }
}

export async function buildJourneyHubAdminPanel(hub: HubKey, window: JourneyAggregationWindow): Promise<{
  hub: HubKey;
  performance: Awaited<ReturnType<typeof getJourneyHubPerformanceSummary>>;
  steps: JourneyStepPerformanceSummary[];
  suggestions: Awaited<ReturnType<typeof getJourneySuggestionEffectivenessSummary>>;
  blockers: Awaited<ReturnType<typeof getJourneyBlockerImpactSummary>>;
  attribution: Awaited<ReturnType<typeof getJourneyAttributionSummary>>;
  exploratoryAttribution: Awaited<ReturnType<typeof buildJourneyOutcomeAttribution>>;
  lowConfidenceHubs: HubKey[];
  freshness: JourneyAdminFreshness;
  flags: {
    dashboard: boolean;
    attribution: boolean;
    feedback: boolean;
  };
}> {
  try {
    const repo = createJourneyAnalyticsRepository();
    const meta = repo.getMeta();
    const performance = await getJourneyHubPerformanceSummary(hub, window, repo);
    const steps = repo.getJourneyStepPerformance(hub, window);
    const suggestions = await getJourneySuggestionEffectivenessSummary(hub, window, repo);
    const blockers = await getJourneyBlockerImpactSummary(hub, window, repo);
    const attribution = await getJourneyAttributionSummary(hub, window, repo);
    const exploratoryAttribution = await buildJourneyOutcomeAttribution(hub, window);

    const portfolio = await getJourneyPortfolioPerformanceSummary(window, repo);
    const lowConfidenceHubs = portfolio.filter((p) => p.lowConfidenceEventShare >= 0.35).map((p) => p.hub);

    return {
      hub,
      performance,
      suggestions,
      blockers,
      attribution,
      exploratoryAttribution,
      lowConfidenceHubs,
      freshness: {
        journeyEventSource: meta.journeyEventSource,
        availabilityNote:
          "Per-hub analytics merge in-memory journey buffers with platform-wide funnel totals.",
      },
      flags: {
        dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    };
  } catch {
    return {
      hub,
      performance: await getJourneyHubPerformanceSummary(hub, window),
      steps: [],
      suggestions: [],
      blockers: [],
      attribution: await getJourneyAttributionSummary(hub, window),
      exploratoryAttribution: await buildJourneyOutcomeAttribution(hub, window),
      lowConfidenceHubs: [],
      freshness: {
        journeyEventSource: "unknown",
        availabilityNote: "Partial failure — empty-safe defaults returned.",
      },
      flags: {
        dashboard: engineFlags.hubJourneyAnalyticsDashboardV1,
        attribution: engineFlags.hubJourneyAttributionV1,
        feedback: engineFlags.hubJourneyFeedbackV1,
      },
    };
  }
}
