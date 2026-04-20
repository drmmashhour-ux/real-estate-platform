import type { JourneyAggregationWindow } from "./journey-analytics.types";
import type { JourneyAnalyticsEventPayload } from "./journey-analytics.types";
import { createJourneyAnalyticsRepository } from "./journey-analytics.repository";
import { windowDurationMs, windowStartMs } from "./journey-analytics.window";
import type { HubKey } from "./hub-journey.types";

export type OutcomeEventKind =
  | "lead_capture"
  | "booking_started"
  | "booking_completed"
  | "listing_draft_created"
  | "listing_published"
  | "contact_unlock";

export type JourneyOutcomeAttributionRow = {
  outcome: OutcomeEventKind;
  /** Reasoning text for audit — not legal proof */
  rationale: string;
  journeyEventTimestampMs: number;
  outcomeTimestampMs: number;
  deltaMs: number;
};

const MAX_ATTRIBUTION_LAG_MS = 86_400_000 * 7;

/** Deterministic last-touch style ordering check on two timestamps. */
export function attributeEventSequenceToOutcome(
  journeyEvents: Pick<JourneyAnalyticsEventPayload, "timestampMs">[],
  outcomeTimestampMs: number,
): { eligible: boolean; lastJourneyBeforeOutcome: number | null } {
  try {
    if (!journeyEvents.length) return { eligible: false, lastJourneyBeforeOutcome: null };
    const before = journeyEvents.filter((e) => e.timestampMs < outcomeTimestampMs);
    if (!before.length) return { eligible: false, lastJourneyBeforeOutcome: null };
    const last = before.reduce((a, b) => (a.timestampMs >= b.timestampMs ? a : b));
    const delta = outcomeTimestampMs - last.timestampMs;
    if (delta < 0 || delta > MAX_ATTRIBUTION_LAG_MS) return { eligible: false, lastJourneyBeforeOutcome: last.timestampMs };
    return { eligible: true, lastJourneyBeforeOutcome: last.timestampMs };
  } catch {
    return { eligible: false, lastJourneyBeforeOutcome: null };
  }
}

/**
 * Builds an exploratory attribution view from in-memory journey events + synthetic outcome timeline.
 * Does not claim causation.
 */
export async function buildJourneyOutcomeAttribution(
  hub: HubKey,
  window: JourneyAggregationWindow,
): Promise<{ rows: JourneyOutcomeAttributionRow[]; note: string }> {
  try {
    const repo = createJourneyAnalyticsRepository();
    const ev = repo.getRawEvents(window, hub);
    const since = windowStartMs(window);
    const syntheticOutcomeMs = since + windowDurationMs(window) / 2;
    const seq = attributeEventSequenceToOutcome(ev, syntheticOutcomeMs);
    if (!seq.eligible || seq.lastJourneyBeforeOutcome === null) {
      return {
        rows: [],
        note: "Insufficient journey→outcome ordering in window for illustrative pairing.",
      };
    }
    return {
      rows: [
        {
          outcome: "booking_started",
          rationale:
            "Illustrative pairing: last journey engagement before midpoint of window (proxy only).",
          journeyEventTimestampMs: seq.lastJourneyBeforeOutcome,
          outcomeTimestampMs: syntheticOutcomeMs,
          deltaMs: syntheticOutcomeMs - seq.lastJourneyBeforeOutcome,
        },
      ],
      note: "Synthetic midpoint outcome used — replace with correlated business events when wired.",
    };
  } catch {
    return { rows: [], note: "Attribution unavailable." };
  }
}
