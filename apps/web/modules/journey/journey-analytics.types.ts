/**
 * Phase 2 journey analytics — shared types only (no business logic).
 */

import type { HubKey } from "./hub-journey.types";

export type JourneyAnalyticsEventName =
  | "journey_banner_viewed"
  | "journey_next_clicked"
  | "journey_suggestion_viewed"
  | "journey_suggestion_clicked"
  | "journey_blocker_viewed"
  | "journey_step_completed"
  | "journey_hub_completed";

export type JourneyActorType = "guest" | "user" | "admin";

export type JourneyConfidence = "high" | "medium" | "low";

/** Normalized envelope for analytics persistence and aggregation (no PII). */
export type JourneyAnalyticsEventPayload = {
  eventName: JourneyAnalyticsEventName;
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  currentStepId?: string | null;
  nextStepId?: string | null;
  progress: number;
  blockerCount: number;
  confidence?: JourneyConfidence;
  suggestionIds?: string[];
  /** Ephemeral correlation only — not user identity */
  correlationId?: string;
  timestampMs: number;
};

export type JourneyAggregationWindow = "1d" | "7d" | "30d" | "90d";

export type JourneyHubPerformanceSummary = {
  hub: HubKey;
  window: JourneyAggregationWindow;
  bannerViews: number;
  nextClicks: number;
  suggestionViews: number;
  suggestionClicks: number;
  blockerViews: number;
  stepCompletedCount: number;
  hubCompletedCount: number;
  /** suggestionClicks / max(1, suggestionViews) */
  suggestionCtr: number;
  /** hubCompletedCount / max(1, bannerViews) */
  hubCompletionRate: number;
  /** Step id with largest drop-off proxy (lowest relative completion vs views) — empty if unknown */
  topDropOffStepId: string | null;
  lowConfidenceEventShare: number;
};

export type JourneyStepPerformanceSummary = {
  stepId: string;
  views: number;
  completions: number;
  completionRate: number;
};

export type JourneySuggestionPerformanceSummary = {
  suggestionId: string;
  views: number;
  clicks: number;
  ctr: number;
};

export type JourneyOutcomeAttributionSummary = {
  hub: HubKey;
  window: JourneyAggregationWindow;
  /** Human-readable scope label */
  methodology: "last_touch_proxy";
  disclaimer: string;
  /** Platform-wide funnel counts (not hub-scoped in source data) */
  platformOutcomeCounts: Record<string, number>;
  journeyTouchCounts: {
    bannerViews: number;
    uniqueSessionsProxy: number;
  };
  /** Illustrative ratio only — not causal */
  attributedShareUpperBound: number | null;
};

export type JourneyFeedbackSignal = "helpful" | "not_helpful" | "dismissed";
