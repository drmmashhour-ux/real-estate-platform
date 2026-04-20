import type { JourneyAggregationWindow } from "./journey-analytics.types";

export function parseAggregationWindow(query: string | null | undefined): JourneyAggregationWindow {
  const d = String(query ?? "30d").trim().toLowerCase();
  if (d === "1d" || d === "7d" || d === "30d" || d === "90d") return d;
  return "30d";
}

export function windowDurationMs(window: JourneyAggregationWindow): number {
  const days =
    window === "1d" ? 1 : window === "7d" ? 7 : window === "30d" ? 30 : 90;
  return days * 86_400_000;
}

export function windowStartMs(window: JourneyAggregationWindow, nowMs = Date.now()): number {
  return nowMs - windowDurationMs(window);
}
