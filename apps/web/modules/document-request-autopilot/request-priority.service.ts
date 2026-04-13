import type { AutopilotSuggestion } from "./document-request-autopilot.types";

export function sortSuggestionsByUrgency(s: AutopilotSuggestion[]): AutopilotSuggestion[] {
  const rank = { high: 0, medium: 1, low: 2 };
  return [...s].sort((a, b) => rank[a.urgency] - rank[b.urgency]);
}
