"use client";

import { postJourneyOutcome } from "@/lib/journey/post-journey-outcome";
import type {
  HubJourneySignalConfidence,
  HubKey,
  JourneyActorType,
} from "@/modules/journey/hub-journey.types";
import { useJourneyCorrelationId } from "./JourneyCorrelationProvider";

export type HubJourneyNextCtaProps = {
  analyticsEnabled?: boolean;
  hub?: HubKey;
  locale?: string;
  country?: string;
  actorType?: JourneyActorType;
  progressPercent?: number;
  currentStepId?: string;
  nextStepId?: string;
  blockerCount?: number;
  confidence?: HubJourneySignalConfidence;
};

export function HubJourneyNextCta(props: HubJourneyNextCtaProps = {}) {
  const correlationId = useJourneyCorrelationId();
  const {
    analyticsEnabled,
    hub,
    locale,
    country,
    actorType,
    progressPercent,
    currentStepId,
    nextStepId,
    blockerCount,
    confidence,
  } = props;

  return (
    <button
      type="button"
      className="rounded-full border border-amber-500/40 bg-black/60 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400 hover:bg-amber-500/10"
      onClick={() => {
        const copilot = document.getElementById("hub-copilot-anchor");
        const nextStep = document.getElementById("hub-next-step-anchor");
        const section = document.getElementById("hub-journey-anchor");
        const target = copilot ?? nextStep ?? section;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });

        if (
          analyticsEnabled &&
          hub &&
          locale &&
          country &&
          actorType !== undefined &&
          typeof progressPercent === "number"
        ) {
          void postJourneyOutcome({
            event: "journey_next_cta_clicked",
            hub,
            locale,
            country,
            actorType,
            progressPercent,
            currentStepId: currentStepId ?? null,
            nextStepId: nextStepId ?? null,
            blockerCount,
            confidence,
            correlationId: correlationId ?? undefined,
          });
        }
      }}
    >
      What should I do next?
    </button>
  );
}
