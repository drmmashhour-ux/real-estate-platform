import type { RiskHighlightSeverity, TrustBadgeVariant } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";

export type ClientTrustSummary = {
  /** Plain-language line about price or consideration when present in the document data */
  priceLine: string | null;
  /** Short bullets: occupancy, tenant, inclusions, flags that affect the deal */
  conditions: string[];
  /** Dates or time references found in structured fields (not inferred beyond payload) */
  keyDates: string[];
  /** Notable yes/no disclosures the seller marked */
  majorDeclarations: string[];
};

export type ClientSectionExplanation = {
  sectionKey: string;
  whatItMeans: string;
  whyItMatters: string;
  whatToCheck: string[];
  disclaimer: string;
};

export type RiskHighlight = {
  id: string;
  severity: RiskHighlightSeverity;
  title: string;
  detail: string;
};

export type ClientDocumentTrustState = {
  trustBadge: TrustBadgeVariant;
  signingChecklist: {
    documentComplete: boolean;
    noBlockers: boolean;
    sectionsReviewable: boolean;
  };
  /** True when validation passes and there are no rule blocks or contradictions */
  readyToSign: boolean;
};

export type TransparencyEvent = {
  id: string;
  at: string;
  label: string;
  detail?: string;
  kind: "edit" | "ai" | "approval" | "other";
};

export type ClientTrustExperienceBundle = {
  summary: ClientTrustSummary;
  risks: RiskHighlight[];
  trustState: ClientDocumentTrustState;
  sections: Array<{
    sectionKey: string;
    title: string;
    valuePreview: string;
    hasRisk: boolean;
    riskNote?: string;
  }>;
};
