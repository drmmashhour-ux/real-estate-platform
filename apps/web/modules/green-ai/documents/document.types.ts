/**
 * Structured outputs for downloadable green reports — informational only (not PDF rendering here).
 */

export type ReportTier = "basic" | "premium";

export type GreenDocumentKind =
  /** AI + engine evaluation framing */
  | "GREEN_EVALUATION_REPORT"
  /** Prioritized improvements + illustrative costs */
  | "UPGRADE_PLAN"
  /** Québec-style catalogue matches + illustrative totals */
  | "GRANT_SUMMARY"
  /** Québec ESG factor snapshot */
  | "PROPERTY_ESG_REPORT"
  /** Combined printable bundle (overview + score + upgrades + grants) */
  | "GREEN_UPGRADE_REPORT";

/** Disclaimer required on every generated artefact */
export const GREEN_DOCUMENT_DISCLAIMER =
  "This document is generated for informational purposes. I cannot confirm official eligibility or grant approval.";

export const GREEN_DOCUMENT_MONETIZATION = {
  basic: "Basic summary report is included at no charge.",
  premium:
    "Premium appendix (extended grant rows, Québec ESG factor table, appendix notes) aligns with paid Green Upgrade Program tiers — reconcile with billing.",
} as const;

/** PDF-ready block (pure content; server-side PDF libs can consume later). */
export type PdfReadySectionBlock = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
};

/** Example-friendly shape used by UI previews */
export type PdfReadyOutline = {
  title: string;
  /** Top-level headings in order */
  sections: string[];
};

export type StructuredGreenReport = {
  kind: GreenDocumentKind;
  tier: ReportTier;
  title: string;
  disclaimer: typeof GREEN_DOCUMENT_DISCLAIMER;
  monetizationNote: string;
  generatedAtIso: string;
  outline: PdfReadyOutline;
  pdfReady: PdfReadySectionBlock[];
  /** Lossless structured mirror for integrations / JSON download */
  json: Record<string, unknown>;
};

export type GreenReportBundle = {
  tier: ReportTier;
  disclaimers: {
    document: typeof GREEN_DOCUMENT_DISCLAIMER;
    monetizationNote: string;
    pipeline?: string;
  };
  generatedAtIso: string;
  /** Combined “Green Upgrade Report” covering overview + score + upgrades + grants */
  combined: StructuredGreenReport;
  documents: StructuredGreenReport[];
};
