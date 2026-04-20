import {
  ingestFromOutcomeApi,
  ingestFromTrackPayload,
  ingestJourneyHubCompleted,
  ingestJourneyStepCompleted,
} from "./journey-analytics.ingest";
import type { HubKey, JourneyActorType, JourneyConfidence } from "./hub-journey.types";

type JourneyMetric =
  | "plansBuilt"
  | "copilotStatesBuilt"
  | "blockersDetected"
  | "suggestionsGenerated"
  | "hubsVisited"
  | "missingDataWarnings"
  | "bannerViews"
  | "nextStepClicks"
  | "suggestionViews"
  | "suggestionClicks"
  | "blockerViews";

const counters: Record<JourneyMetric, number> = {
  plansBuilt: 0,
  copilotStatesBuilt: 0,
  blockersDetected: 0,
  suggestionsGenerated: 0,
  hubsVisited: 0,
  missingDataWarnings: 0,
  bannerViews: 0,
  nextStepClicks: 0,
  suggestionViews: 0,
  suggestionClicks: 0,
  blockerViews: 0,
};

/** Shared payload for journey UX analytics — no PII. */
export type JourneyTrackPayload = {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  currentStepId?: string | null;
  nextStepId?: string | null;
  progress: number;
  blockerCount: number;
  confidence?: JourneyConfidence;
  /** Resolved path or logical route hint for observability */
  route?: string;
  suggestionIds?: string[];
};

function emit(eventName: string, payload: Record<string, unknown>): void {
  try {
    const line = `[journey] ${eventName} ${JSON.stringify({ ...payload, timestamp: Date.now() })}`;
    if (typeof console !== "undefined" && console.info) {
      console.info(line);
    }
  } catch {
    /* noop */
  }
}

export function getHubJourneyMonitoringSnapshot(): Record<JourneyMetric, number> {
  return { ...counters };
}

export function resetHubJourneyMonitoringForTests(): void {
  (Object.keys(counters) as JourneyMetric[]).forEach((k) => {
    counters[k] = 0;
  });
}

export function bumpJourneyMetric(metric: JourneyMetric, n = 1): void {
  try {
    counters[metric] = (counters[metric] ?? 0) + n;
  } catch {
    /* never throw */
  }
}

/** Structured log line — never throws. */
export function logJourneyMonitoringEvent(
  kind: "info" | "warn",
  payload: Record<string, unknown>,
): void {
  try {
    const line = `[journey] ${kind} ${JSON.stringify(payload)}`;
    if (typeof console !== "undefined" && console.info) {
      console.info(line);
    }
  } catch {
    /* noop */
  }
}

export function recordHubVisited(hub: HubKey): void {
  try {
    bumpJourneyMetric("hubsVisited");
    logJourneyMonitoringEvent("info", { hub, event: "visit" });
  } catch {
    /* noop */
  }
}

/** Product outcome beacon — structured, must stay PII-free; never throws. */
export function logJourneyOutcomeEvent(payload: Record<string, unknown>): void {
  try {
    const line = `[journey] outcome ${JSON.stringify(payload)}`;
    if (typeof console !== "undefined" && console.info) {
      console.info(line);
    }
  } catch {
    /* noop */
  }
}

/** Structured pipeline logs for ops — never throws. */
export function logJourneyStructuredKind(
  kind:
    | "api_resolved"
    | "banner_rendered"
    | "route_resolved"
    | "weak_signal_detected"
    | "copilot_suggestions_generated",
  payload: Record<string, unknown>,
): void {
  try {
    emit(kind, payload);
  } catch {
    /* noop */
  }
}

function trackCore(
  metric: JourneyMetric,
  eventName: string,
  base: JourneyTrackPayload,
  extra?: Record<string, unknown>,
): void {
  try {
    bumpJourneyMetric(metric);
    emit(eventName, {
      eventName,
      hub: base.hub,
      progress: base.progress,
      confidence: base.confidence,
      blockers: base.blockerCount,
      route: base.route,
      locale: base.locale,
      country: base.country,
      actorType: base.actorType,
      currentStepId: base.currentStepId,
      nextStepId: base.nextStepId,
      suggestionIds: base.suggestionIds,
      ...extra,
    });
    ingestFromTrackPayload(eventName, base);
  } catch {
    /* noop */
  }
}

/** Persistable journey analytics — complements Phase 1 counters (never throws). */
export function persistJourneyOutcomeApiPayload(payload: Parameters<typeof ingestFromOutcomeApi>[0]): void {
  try {
    ingestFromOutcomeApi(payload);
  } catch {
    /* noop */
  }
}

export function trackJourneyStepCompleted(args: {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  progress: number;
  blockerCount: number;
  confidence?: JourneyConfidence;
  completedStepId: string;
  nextStepId?: string | null;
}): void {
  try {
    emit("step_completed", {
      eventName: "journey_step_completed",
      hub: args.hub,
      locale: args.locale,
      country: args.country,
      actorType: args.actorType,
      progress: args.progress,
      blockerCount: args.blockerCount,
      confidence: args.confidence,
      currentStepId: args.completedStepId,
      nextStepId: args.nextStepId,
      timestamp: Date.now(),
    });
    ingestJourneyStepCompleted(args);
  } catch {
    /* noop */
  }
}

export function trackJourneyHubCompleted(args: {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  blockerCount: number;
  confidence?: JourneyConfidence;
  finalStepId?: string | null;
}): void {
  try {
    emit("hub_completed", {
      eventName: "journey_hub_completed",
      hub: args.hub,
      locale: args.locale,
      country: args.country,
      actorType: args.actorType,
      progress: 100,
      blockerCount: args.blockerCount,
      confidence: args.confidence,
      currentStepId: args.finalStepId,
      timestamp: Date.now(),
    });
    ingestJourneyHubCompleted(args);
  } catch {
    /* noop */
  }
}

export function trackJourneyBannerViewed(p: JourneyTrackPayload): void {
  trackCore("bannerViews", "banner_viewed", p);
}

export function trackJourneyNextClicked(p: JourneyTrackPayload): void {
  trackCore("nextStepClicks", "next_clicked", p);
}

export function trackJourneySuggestionViewed(p: JourneyTrackPayload): void {
  trackCore("suggestionViews", "suggestion_viewed", p, {
    suggestionIds: p.suggestionIds,
  });
}

export function trackJourneySuggestionClicked(p: JourneyTrackPayload): void {
  trackCore("suggestionClicks", "suggestion_clicked", p, {
    suggestionIds: p.suggestionIds,
  });
}

export function trackJourneyBlockerViewed(p: JourneyTrackPayload): void {
  trackCore("blockerViews", "blocker_viewed", p);
}
