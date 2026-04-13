/**
 * Phase 4 — Launch AI content API (testable facade).
 * Uses existing deterministic generators; replace internals with LLM calls when ready.
 */
import { generatePropertyHighlights } from "@/modules/marketing-engine/contentEngine";
import { generateSEOPage, generatePost, type SeoPageType } from "@/src/modules/content/contentEngine";
import { mapTopicToSeoType, runDailyAutopilotContent } from "./contentEngine";

export type ListingDescriptionInput = {
  city: string;
  listingTitle?: string | null;
  listingPath?: string | null;
};

export async function generateListingDescription(input: ListingDescriptionInput): Promise<string> {
  return generatePropertyHighlights({
    city: input.city,
    listingTitle: input.listingTitle,
    listingPath: input.listingPath,
  });
}

export type BlogPostInput = {
  city?: string;
  topic?: string;
  pageType?: SeoPageType;
};

export async function generateBlogPost(input: BlogPostInput = {}) {
  const city = input.city?.trim() || "Montreal";
  const type = input.pageType ?? mapTopicToSeoType(input.topic ?? "neighborhood guide");
  return generateSEOPage(city, type);
}

export async function generateAdCopy(campaignBrief: string): Promise<string> {
  return generatePost(campaignBrief.trim() || "LECIPM + BNHUB");
}

export { runDailyAutopilotContent };
