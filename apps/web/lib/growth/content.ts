/**
 * Growth content helpers — real listing inputs only; wraps existing deterministic AI copy utilities.
 */
import type { ListingAnalysisInput } from "@/lib/ai-listing-analysis";
import { optimizeListing as rulesOptimize } from "@/lib/ai/optimize";
import { generateMarketing as brainMarketing } from "@/lib/ai/brain";

export type ListingContentInput = ListingAnalysisInput;

/** Title/description/SEO from rule-based optimizer (no hallucinated comps). */
export function generateListingGrowthPack(listing: ListingContentInput) {
  return rulesOptimize(listing);
}

/** Short marketing block for social / email snippets. */
export function generateSocialSnippet(context: { listingId?: string; title?: string }) {
  return brainMarketing(context);
}

/** Stub for programmatic SEO body sections (returns structured sections from real inputs only). */
export function buildSeoListingSections(input: {
  city: string;
  title: string;
  listingCode?: string;
}): { h1: string; metaDescription: string; bullets: string[] } {
  const city = input.city?.trim() || "your market";
  const title = input.title?.trim() || "Stay";
  return {
    h1: `${title} — ${city}`,
    metaDescription: `Book ${title} in ${city} on LECIPM. Verified stays and transparent pricing.`,
    bullets: [
      `Located in ${city}`,
      input.listingCode ? `Listing ref ${input.listingCode}` : "Instant search and secure checkout",
      "Managed with LECIPM trust and support",
    ],
  };
}
