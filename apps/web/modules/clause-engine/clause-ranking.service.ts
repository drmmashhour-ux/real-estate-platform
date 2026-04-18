import type { ClauseEngineSuggestion } from "./clause-engine.types";

export function rankSuggestions(rows: ClauseEngineSuggestion[]): ClauseEngineSuggestion[] {
  return [...rows].sort((a, b) => b.confidence - a.confidence);
}
