import type { HubKey } from "./hub-journey.types";
import type { JourneyFeedbackSignal } from "./journey-analytics.types";

export type JourneyFeedbackResult = { ok: boolean; stored: boolean };

const MAX = 5_000;
const buf: { hub: HubKey; signal: JourneyFeedbackSignal; suggestionId?: string; stepId?: string; ts: number }[] = [];

/** Bounded deterministic feedback capture — no ML; safe no-op on failure. */
export function captureSuggestionFeedback(args: {
  hub: HubKey;
  suggestionId: string;
  signal: JourneyFeedbackSignal;
}): JourneyFeedbackResult {
  try {
    buf.push({ hub: args.hub, signal: args.signal, suggestionId: args.suggestionId, ts: Date.now() });
    while (buf.length > MAX) buf.shift();
    return { ok: true, stored: true };
  } catch {
    return { ok: false, stored: false };
  }
}

export function captureJourneyDismissal(args: { hub: HubKey }): JourneyFeedbackResult {
  try {
    buf.push({ hub: args.hub, signal: "dismissed", ts: Date.now() });
    while (buf.length > MAX) buf.shift();
    return { ok: true, stored: true };
  } catch {
    return { ok: false, stored: false };
  }
}

export function captureStepHelpfulness(args: {
  hub: HubKey;
  stepId: string;
  signal: Exclude<JourneyFeedbackSignal, "dismissed">;
}): JourneyFeedbackResult {
  try {
    buf.push({
      hub: args.hub,
      signal: args.signal,
      stepId: args.stepId,
      ts: Date.now(),
    });
    while (buf.length > MAX) buf.shift();
    return { ok: true, stored: true };
  } catch {
    return { ok: false, stored: false };
  }
}

export function snapshotJourneyFeedbackForTests(): typeof buf {
  return [...buf];
}

export function resetJourneyFeedbackForTests(): void {
  try {
    buf.length = 0;
  } catch {
    /* noop */
  }
}
