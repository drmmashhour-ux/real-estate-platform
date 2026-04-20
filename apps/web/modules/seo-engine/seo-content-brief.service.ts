import type { SeoContentBrief } from "./seo-engine.types";
import { findForbiddenTerm } from "./seo-quality-rules";

export type EditorialBriefTopic =
  | "luxury_rentals_montreal"
  | "invest_evaluate_laval"
  | "residence_services_family_checklist";

const DISCLAIMER =
  "LECIPM is a real estate and residence-services coordination platform; editorial content must stay informational.";

/**
 * Builds editorial briefs for blog / Marketing Hub — requires human review before publish.
 */
export function buildEditorialContentBrief(topic: EditorialBriefTopic): SeoContentBrief {
  if (topic === "luxury_rentals_montreal") {
    return {
      topic: "Best neighborhoods for luxury rentals in Montreal",
      keywordTarget: "luxury rentals Montreal",
      introAngle:
        "Compare neighborhoods using commute, lifestyle, and rental dynamics — avoid claiming ‘best’ without criteria.",
      outline: [
        "Define audience (executive relocation vs. local move-up)",
        "Use 3–5 neighborhoods with factual anchors (transit lines, landmarks)",
        "Trade-offs: price bands, lease norms, seasonal demand (no guarantees)",
        "How LECIPM search filters help narrow options",
        "CTA: browse / save / connect with a broker",
      ],
      cta: "Explore luxury rentals on LECIPM and save your shortlist.",
      linkedPages: [
        { path: "/listings", anchorSuggestion: "Montreal listings" },
        { path: "/city/montreal", anchorSuggestion: "Montreal city guide" },
      ],
      reviewNote: DISCLAIMER,
    };
  }
  if (topic === "invest_evaluate_laval") {
    return {
      topic: "How to evaluate investment properties in Laval",
      keywordTarget: "investment property Laval",
      introAngle:
        "Educational framing: underwriting checklist and risk awareness — not performance promises.",
      outline: [
        "Market context (informational; cite sources where possible)",
        "Operating costs and vacancy assumptions (general)",
        "Financing and stress-testing (high-level)",
        "Using LECIPM investor tools where available",
      ],
      cta: "Use LECIPM investor flows to track opportunities responsibly.",
      linkedPages: [
        { path: "/investor", anchorSuggestion: "Investor hub" },
        { path: "/evaluate", anchorSuggestion: "Evaluation tools" },
      ],
      reviewNote: DISCLAIMER,
    };
  }

  return {
    topic: "What families should look for in residence services listings",
    keywordTarget: "residence services Montreal",
    introAngle:
      "Operational checklist for choosing a residence: services, billing, communication, family access — no clinical language.",
    outline: [
      "Scope: coordination platform vs. services provided on-site",
      "Questions for tours (meals, housekeeping, guest policies)",
      "Family portal: alerts and messaging (operational)",
      "Camera tools: external providers only; LECIPM does not host video",
    ],
    cta: "Browse residence services listings and book a consultation with the residence.",
    linkedPages: [
      { path: "/residence-services", anchorSuggestion: "Residence services" },
      { path: "/support", anchorSuggestion: "Help center" },
    ],
    reviewNote: `${DISCLAIMER} No medical or diagnostic framing.`,
  };
}

/**
 * Validates brief text fields for forbidden terms; returns issues for CI or UI warnings.
 */
export function validateBriefGuardrails(brief: SeoContentBrief): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const bag = [brief.topic, brief.introAngle, brief.cta, brief.reviewNote, ...brief.outline].join(" ");
  const hit = findForbiddenTerm(bag);
  if (hit) issues.push(`Forbidden term detected: ${hit}`);
  return { ok: issues.length === 0, issues };
}
