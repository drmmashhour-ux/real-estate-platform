/**
 * Non-destructive CRO overlay — wraps page data with advisory suggestions only.
 * Does not mutate `pageData` or change live UI without an explicit consumer.
 */

import type { AiInfluenceSuggestion } from "./ai-autopilot-influence.types";

export type CROInfluenceOverlay<T> = {
  original: T;
  /** Subset of influence suggestions relevant to CRO / UI presentation. */
  suggestions: AiInfluenceSuggestion[];
};

/**
 * Returns a new object `{ original, suggestions }` — does not modify `pageData`.
 */
export function applyCROInfluenceOverlay<T>(
  pageData: T,
  suggestions: AiInfluenceSuggestion[],
): CROInfluenceOverlay<T> {
  const cro = suggestions.filter((s) => s.target === "cro_ui");
  return {
    original: pageData,
    suggestions: cro,
  };
}
