import type { ResidentialKnowledgeAttribution } from "./residential-knowledge.types";

/**
 * Links UI-safe labels to retrieval keys — does not embed source body text.
 */
export function linkAttributionToRetrievalQuery(attr: ResidentialKnowledgeAttribution): string {
  return [attr.referenceLabel, attr.detail].filter(Boolean).join(" ");
}
