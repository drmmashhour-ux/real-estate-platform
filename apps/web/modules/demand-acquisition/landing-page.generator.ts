import type { SeoSuggestion } from "./seo-engine.service";

export type LandingStub = {
  path: string;
  heroTitle: string;
  supportingCopy: string;
  reviewRequired: true;
};

/** Suggested on-site landing composition — not auto-published. */
export function composeListingLandingStub(seo: SeoSuggestion, canonicalPath: string): LandingStub {
  return {
    path: canonicalPath,
    heroTitle: seo.titleSuggestion,
    supportingCopy: seo.metaDescription,
    reviewRequired: true,
  };
}
