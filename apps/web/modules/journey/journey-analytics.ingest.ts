import { appendJourneyAnalyticsEvent } from "./journey-analytics.memory-store";
import type {
  JourneyActorType,
  JourneyAnalyticsEventName,
  JourneyAnalyticsEventPayload,
  JourneyConfidence,
} from "./journey-analytics.types";
import type { HubKey, JourneyOutcomeEventName } from "./hub-journey.types";

/** Mirrors `JourneyTrackPayload` without importing monitoring (avoid circular deps). */
export type JourneyTrackPayloadLike = {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: string;
  progress: number;
  blockerCount: number;
  confidence?: JourneyConfidence;
  currentStepId?: string | null;
  nextStepId?: string | null;
  suggestionIds?: string[];
};

function normalizeActorForAnalytics(raw: string): JourneyActorType {
  const u = raw.toLowerCase();
  if (u === "user" || u === "guest" || u === "admin") return u as JourneyActorType;
  if (u === "authenticated") return "user";
  if (u === "operator") return "admin";
  return "guest";
}

const OUTCOME_TO_ANALYTICS: Partial<Record<JourneyOutcomeEventName, JourneyAnalyticsEventName>> = {
  journey_banner_viewed: "journey_banner_viewed",
  journey_next_cta_clicked: "journey_next_clicked",
  journey_copilot_suggestion_viewed: "journey_suggestion_viewed",
  journey_copilot_suggestion_clicked: "journey_suggestion_clicked",
  journey_blocker_viewed: "journey_blocker_viewed",
};

const LOG_TO_ANALYTICS: Record<string, JourneyAnalyticsEventName> = {
  banner_viewed: "journey_banner_viewed",
  next_clicked: "journey_next_clicked",
  suggestion_viewed: "journey_suggestion_viewed",
  suggestion_clicked: "journey_suggestion_clicked",
  blocker_viewed: "journey_blocker_viewed",
};

function toPayload(
  eventName: JourneyAnalyticsEventName,
  base: {
    hub: HubKey;
    locale: string;
    country: string;
    actorType: JourneyActorType;
    progress: number;
    blockerCount: number;
    confidence?: JourneyConfidence;
    currentStepId?: string | null;
    nextStepId?: string | null;
    suggestionIds?: string[];
    correlationId?: string;
  },
): JourneyAnalyticsEventPayload {
  return {
    eventName,
    hub: base.hub,
    locale: base.locale,
    country: base.country,
    actorType: base.actorType,
    currentStepId: base.currentStepId,
    nextStepId: base.nextStepId,
    progress: base.progress,
    blockerCount: base.blockerCount,
    confidence: base.confidence,
    suggestionIds: base.suggestionIds,
    correlationId: base.correlationId,
    timestampMs: Date.now(),
  };
}

/** Persist normalized Phase 2 row (never throws). */
export function ingestJourneyAnalyticsPayload(payload: JourneyAnalyticsEventPayload): void {
  try {
    appendJourneyAnalyticsEvent(payload);
  } catch {
    /* noop */
  }
}

/** Maps Phase 1 track short names to canonical analytics names. */
export function ingestFromTrackPayload(shortLogName: string, p: JourneyTrackPayloadLike): void {
  try {
    const canonical = LOG_TO_ANALYTICS[shortLogName];
    if (!canonical) return;
    ingestJourneyAnalyticsPayload(
      toPayload(canonical, {
        hub: p.hub,
        locale: p.locale,
        country: p.country,
        actorType: normalizeActorForAnalytics(String(p.actorType ?? "guest")),
        progress: p.progress,
        blockerCount: p.blockerCount,
        confidence: p.confidence as JourneyConfidence | undefined,
        currentStepId: p.currentStepId,
        nextStepId: p.nextStepId,
        suggestionIds: p.suggestionIds,
      }),
    );
  } catch {
    /* noop */
  }
}

/** Maps POST /api/journey/outcome envelope to canonical analytics names. */
/** Step completion — stores completed step id on `currentStepId`. */
export function ingestJourneyStepCompleted(args: {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: string;
  progress: number;
  blockerCount: number;
  confidence?: JourneyConfidence;
  completedStepId: string;
  nextStepId?: string | null;
}): void {
  ingestJourneyAnalyticsPayload(
    toPayload("journey_step_completed", {
      hub: args.hub,
      locale: args.locale,
      country: args.country,
      actorType: normalizeActorForAnalytics(args.actorType),
      progress: args.progress,
      blockerCount: args.blockerCount,
      confidence: args.confidence,
      currentStepId: args.completedStepId,
      nextStepId: args.nextStepId ?? null,
    }),
  );
}

export function ingestJourneyHubCompleted(args: {
  hub: HubKey;
  locale: string;
  country: string;
  actorType: string;
  blockerCount: number;
  confidence?: JourneyConfidence;
  finalStepId?: string | null;
}): void {
  ingestJourneyAnalyticsPayload(
    toPayload("journey_hub_completed", {
      hub: args.hub,
      locale: args.locale,
      country: args.country,
      actorType: normalizeActorForAnalytics(args.actorType),
      progress: 100,
      blockerCount: args.blockerCount,
      confidence: args.confidence,
      currentStepId: args.finalStepId ?? null,
      nextStepId: null,
    }),
  );
}

export function ingestFromOutcomeApi(args: {
  event: JourneyOutcomeEventName;
  hub: HubKey;
  locale: string;
  country: string;
  actorType: string;
  progressPercent?: number;
  currentStepId?: string;
  nextStepId?: string;
  blockerCount?: number;
  confidence?: JourneyAnalyticsEventPayload["confidence"];
  suggestionIds?: string[];
  correlationId?: string;
}): void {
  try {
    const canonical = OUTCOME_TO_ANALYTICS[args.event];
    if (!canonical) return;
    ingestJourneyAnalyticsPayload(
      toPayload(canonical, {
        hub: args.hub,
        locale: args.locale,
        country: args.country,
        actorType: normalizeActorForAnalytics(args.actorType),
        progress: args.progressPercent ?? 0,
        blockerCount: args.blockerCount ?? 0,
        confidence: args.confidence,
        currentStepId: args.currentStepId ?? null,
        nextStepId: args.nextStepId ?? null,
        suggestionIds: args.suggestionIds,
        correlationId: args.correlationId,
      }),
    );
  } catch {
    /* noop */
  }
}
