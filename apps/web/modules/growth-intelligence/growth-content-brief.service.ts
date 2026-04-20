import type { GrowthOpportunity } from "./growth.types";

export type GrowthContentBrief = {
  title: string;
  purpose: string;
  targetAudience: string;
  targetRegion: string | null;
  targetCategory: string | null;
  trustComplianceAngle: string;
  keySections: string[];
  ctaGoals: string[];
  notesForReview: string[];
  disclaimers: string[];
  /** Deterministic rationale string — no invented metrics */
  whyGeneratedNow: string;
  /** Facts from timeline metadata when present */
  timelineEvidenceSummary: string[];
};

const FOOTER =
  "Internal draft brief only — requires governance/editorial approval before any public publishing.";

function whyNow(opp: GrowthOpportunity): string {
  return `Triggered by opportunity ${opp.opportunityType} (${String(opp.metadata.signalType ?? "signal")}) — human review required.`;
}

function timelineEvidence(opp: GrowthOpportunity): string[] {
  const m = opp.metadata;
  const lines: string[] = [];
  if (m.timelineDerived === true) lines.push("Source: append-only event timeline aggregates (when enabled).");
  if (typeof m.currPositive === "number" && typeof m.prevPositive === "number") {
    lines.push(`Timeline: positive events curr=${m.currPositive} vs prev=${m.prevPositive} (internal labels).`);
  }
  if (typeof m.stalledWorkflowCount === "number") {
    lines.push(`Workflow stall heuristic count=${m.stalledWorkflowCount}.`);
  }
  if (typeof m.rejections30d === "number") {
    lines.push(`Document rejections in window=${m.rejections30d}.`);
  }
  return lines.length ? lines : ["No timeline evidence fields attached to this opportunity."];
}

export function buildSeoContentBrief(opportunity: GrowthOpportunity): GrowthContentBrief {
  return {
    title: `SEO editorial brief — ${opportunity.title}`,
    purpose:
      "Produce human-reviewed localized SEO content aligned with Legal Hub / trust disclosures — no auto-publish.",
    targetAudience: "Organic search buyers/sellers in target geography",
    targetRegion: opportunity.region,
    targetCategory: opportunity.entityType === "region" ? "market_seo" : null,
    trustComplianceAngle:
      "Include truthful trust signals only; avoid implying legal findings; cite verification where applicable.",
    keySections: ["Intent summary", "Local keyword themes", "Structured outline", "Internal linking plan", FOOTER],
    ctaGoals: ["Drive qualified listing inquiries", "Maintain compliance-safe claims"],
    notesForReview: [
      opportunity.explanation,
      `Linked opportunity id=${opportunity.id}`,
      `Signals: ${opportunity.signalIds.join(",")}`,
    ],
    disclaimers: [
      "Not legal advice.",
      "Metrics in brief are contextual from snapshot — verify before claims.",
    ],
    whyGeneratedNow: whyNow(opportunity),
    timelineEvidenceSummary: timelineEvidence(opportunity),
  };
}

export function buildProgrammaticLandingBrief(opportunity: GrowthOpportunity): GrowthContentBrief {
  return {
    title: `Programmatic landing brief — ${opportunity.region ?? opportunity.title}`,
    purpose:
      "Draft structured landing outline for engineering/content — programmatic generation disabled until approved.",
    targetAudience: "High-intent localized traffic",
    targetRegion: opportunity.region,
    targetCategory: "programmatic_seo",
    trustComplianceAngle: "Surface broker verification paths; avoid deceptive scarcity.",
    keySections: ["Hero value prop", "Market facts (verified)", "Listing grid embed", "FAQ", FOOTER],
    ctaGoals: ["Save listing", "Contact broker", "Book showing"],
    notesForReview: [opportunity.explanation],
    disclaimers: ["Supply/demand figures are proxies — validate against BI."],
    whyGeneratedNow: whyNow(opportunity),
    timelineEvidenceSummary: timelineEvidence(opportunity),
  };
}

export function buildCtaImprovementBrief(opportunity: GrowthOpportunity): GrowthContentBrief {
  return {
    title: `CTA improvement brief — ${opportunity.entityId ?? opportunity.title}`,
    purpose:
      "Human UX/legal review of CTAs and gating — adjust copy without exposing internal funnel ratios publicly.",
    targetAudience: "Listing visitors satisfying legal prerequisites",
    targetRegion: opportunity.region,
    targetCategory: opportunity.entityType,
    trustComplianceAngle: "Ensure legal acknowledgments remain prominent; test paywall transparency.",
    keySections: ["Current friction hypothesis", "Proposed CTA variants", "Measurement plan", FOOTER],
    ctaGoals: ["Increase qualified contacts", "Reduce abandonment post-acknowledgment"],
    notesForReview: [opportunity.explanation],
    disclaimers: ["Do not imply guaranteed outcomes."],
    whyGeneratedNow: whyNow(opportunity),
    timelineEvidenceSummary: timelineEvidence(opportunity),
  };
}
