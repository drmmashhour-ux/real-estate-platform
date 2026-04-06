import type { ContentSurface, ContentStatus, GenerateContentInput } from "./types";

/** Surfaces that must never auto-publish without human review */
export const HIGH_RISK_SURFACES: ReadonlySet<ContentSurface> = new Set([
  "email_campaign",
  "notification",
  "market_banner",
  "faq_answer",
]);

/** Surfaces where we only suggest copy; host/system applies explicitly */
export const LISTING_HOST_SURFACES: ReadonlySet<ContentSurface> = new Set([
  "listing_title",
  "listing_description",
  "listing_seo_meta",
  "host_recommendation",
]);

const ORDER: ContentStatus[] = ["draft", "pending_review", "approved", "rejected", "published"];

export function isValidStatus(s: string): s is ContentStatus {
  return (ORDER as string[]).includes(s);
}

export function requiresReviewBeforePublish(surface: ContentSurface): boolean {
  return HIGH_RISK_SURFACES.has(surface) || LISTING_HOST_SURFACES.has(surface);
}

export function defaultInitialStatus(surface: ContentSurface): ContentStatus {
  return requiresReviewBeforePublish(surface) ? "pending_review" : "draft";
}

/** Hook for pre-LLM validation: do not invent amenities, legal claims, ratings, distances. */
export function assertNoFabricatedClaims(_input: GenerateContentInput): void {
  /* Callers / LLM wrappers should strip or block unknown claims before generation. */
}
