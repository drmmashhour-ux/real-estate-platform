/**
 * Counters + logs for influence suggestions (advisory only — no execution).
 */

import { logInfo } from "@/lib/logger";

const counts = {
  suggestionsGenerated: 0,
  suggestionsViewed: 0,
  suggestionsConvertedToActions: 0,
};

export function resetInfluenceMonitoringForTests(): void {
  counts.suggestionsGenerated = 0;
  counts.suggestionsViewed = 0;
  counts.suggestionsConvertedToActions = 0;
}

export function getInfluenceMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function recordInfluenceSuggestionsGenerated(n: number): void {
  counts.suggestionsGenerated += n;
  logInfo("[autopilot:influence]", { event: "suggestions_generated", count: n });
}

export function recordInfluenceSuggestionsViewed(n: number): void {
  counts.suggestionsViewed += n;
  logInfo("[autopilot:influence]", { event: "suggestions_viewed", count: n });
}

export function recordInfluenceConvertedToAction(suggestionId: string): void {
  counts.suggestionsConvertedToActions += 1;
  logInfo("[autopilot:influence]", { event: "convert_to_action_click", suggestionId });
}
