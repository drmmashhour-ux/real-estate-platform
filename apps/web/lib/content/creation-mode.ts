import type { ContentCreationMode, ContentLocale } from "./types";

/**
 * FR/AR typically use `translate_from_source` when a reviewed EN draft exists — keeps disclaimers aligned.
 * Arabic still uses the same glossary keys via `translateServer`; RTL/`dir` is a layout concern elsewhere.
 */
export function resolveCreationMode(input: {
  targetLocale: ContentLocale;
  hasApprovedEnglishSource: boolean;
  /** Syria / culturally distinct market pages */
  culturalAdaptation: boolean;
}): ContentCreationMode {
  if (input.culturalAdaptation) return "hybrid_localize";
  if (input.hasApprovedEnglishSource && input.targetLocale !== "en") return "translate_from_source";
  return "generate_native";
}
