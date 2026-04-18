import type { HubKey } from "./hub-journey.types";

type JourneyMetric =
  | "plansBuilt"
  | "copilotStatesBuilt"
  | "blockersDetected"
  | "suggestionsGenerated"
  | "hubsVisited"
  | "missingDataWarnings";

const counters: Record<JourneyMetric, number> = {
  plansBuilt: 0,
  copilotStatesBuilt: 0,
  blockersDetected: 0,
  suggestionsGenerated: 0,
  hubsVisited: 0,
  missingDataWarnings: 0,
};

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
