"use client";

import { useEffect, useRef } from "react";
import { postJourneyOutcome } from "@/lib/journey/post-journey-outcome";
import type {
  HubJourneySignalConfidence,
  HubKey,
  JourneyActorType,
} from "@/modules/journey/hub-journey.types";
import { useJourneyCorrelationId } from "./JourneyCorrelationProvider";

type Props = {
  enabled: boolean;
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  progressPercent: number;
  currentStepId?: string;
  nextStepId?: string;
  blockerCount: number;
  confidence?: HubJourneySignalConfidence;
  suggestionIds: string[];
};

/** Outcome beacons — fire-and-forget; never blocks render. */
export function HubJourneyAnalyticsBeacon(props: Props) {
  const correlationId = useJourneyCorrelationId();
  const fired = useRef({ banner: false, blocker: false, copilot: false });

  useEffect(() => {
    if (!props.enabled) return;
    if (fired.current.banner) return;
    fired.current.banner = true;
    void postJourneyOutcome({
      event: "journey_banner_viewed",
      hub: props.hub,
      locale: props.locale,
      country: props.country,
      actorType: props.actorType,
      progressPercent: props.progressPercent,
      currentStepId: props.currentStepId ?? null,
      nextStepId: props.nextStepId ?? null,
      blockerCount: props.blockerCount,
      confidence: props.confidence,
      suggestionIds: props.suggestionIds,
      correlationId: correlationId ?? undefined,
    });
  }, [
    props.enabled,
    props.hub,
    props.locale,
    props.country,
    props.actorType,
    props.progressPercent,
    props.currentStepId,
    props.nextStepId,
    props.blockerCount,
    props.confidence,
    props.suggestionIds,
    correlationId,
  ]);

  useEffect(() => {
    if (!props.enabled || props.blockerCount <= 0) return;
    if (fired.current.blocker) return;
    fired.current.blocker = true;
    void postJourneyOutcome({
      event: "journey_blocker_viewed",
      hub: props.hub,
      locale: props.locale,
      country: props.country,
      actorType: props.actorType,
      progressPercent: props.progressPercent,
      currentStepId: props.currentStepId ?? null,
      nextStepId: props.nextStepId ?? null,
      blockerCount: props.blockerCount,
      confidence: props.confidence,
      correlationId: correlationId ?? undefined,
    });
  }, [
    props.enabled,
    props.blockerCount,
    props.hub,
    props.locale,
    props.country,
    props.actorType,
    props.progressPercent,
    props.currentStepId,
    props.nextStepId,
    props.confidence,
    correlationId,
  ]);

  useEffect(() => {
    if (!props.enabled || props.suggestionIds.length === 0) return;
    if (fired.current.copilot) return;
    fired.current.copilot = true;
    void postJourneyOutcome({
      event: "journey_copilot_suggestion_viewed",
      hub: props.hub,
      locale: props.locale,
      country: props.country,
      actorType: props.actorType,
      progressPercent: props.progressPercent,
      currentStepId: props.currentStepId ?? null,
      nextStepId: props.nextStepId ?? null,
      blockerCount: props.blockerCount,
      confidence: props.confidence,
      suggestionIds: props.suggestionIds,
      correlationId: correlationId ?? undefined,
    });
  }, [
    props.enabled,
    props.suggestionIds,
    props.hub,
    props.locale,
    props.country,
    props.actorType,
    props.progressPercent,
    props.currentStepId,
    props.nextStepId,
    props.blockerCount,
    props.confidence,
    correlationId,
  ]);

  return null;
}
