"use client";

import type {
  HubJourneySignalConfidence,
  HubKey,
  JourneyActorType,
  JourneyOutcomeEventName,
} from "@/modules/journey/hub-journey.types";

export type JourneyOutcomeBeaconPayload = {
  event: JourneyOutcomeEventName;
  hub: HubKey;
  locale: string;
  country: string;
  actorType: JourneyActorType;
  progressPercent?: number;
  currentStepId?: string | null;
  nextStepId?: string | null;
  blockerCount?: number;
  confidence?: HubJourneySignalConfidence;
  suggestionIds?: string[];
  correlationId?: string;
};

/** Fire-and-forget POST to `/api/journey/outcome`. Never throws. */
export async function postJourneyOutcome(payload: JourneyOutcomeBeaconPayload): Promise<void> {
  try {
    await fetch("/api/journey/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch {
    /* noop */
  }
}
