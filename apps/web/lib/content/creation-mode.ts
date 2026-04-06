import type { ContentCreationMode, ContentLocale } from "./types";

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
