import type {
  GeneratedListingContent,
  ListingLanguage,
  ListingPropertyPartial,
} from "@/modules/listing-assistant/listing-assistant.types";
import { generateListingContent } from "@/modules/listing-assistant/listing-content.generator";

export function normalizeListingLanguage(raw: unknown): ListingLanguage {
  if (raw === "fr" || raw === "ar" || raw === "en") return raw;
  return "en";
}

/**
 * Multilingual listing draft — `generateListing(language)` entry point.
 * Delegates to deterministic templates (auditable; broker validates).
 */
export function generateListing(
  property: ListingPropertyPartial,
  language?: string,
): GeneratedListingContent {
  const lang = normalizeListingLanguage(language);
  return generateListingContent(property, lang);
}
