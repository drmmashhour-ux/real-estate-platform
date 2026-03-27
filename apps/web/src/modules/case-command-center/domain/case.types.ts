import type { LegalGraphSummary } from "@/src/modules/legal-intelligence-graph/domain/legalGraph.types";
import type { KnowledgeRuleEvaluation } from "@/src/modules/knowledge/rules/knowledgeRuleEngine";

export type CaseRecommendation = { priority: "high" | "medium" | "low"; action: string };

export type CaseHealthStatus = "critical" | "attention" | "ready";

export type CaseDocumentPanelState = "complete" | "incomplete" | "blocked";

export type CaseHealthBlockerItem = {
  id: string;
  label: string;
  /** Declaration section key for deep-linking */
  sectionKey?: string;
};

export type CaseSignatureReadinessStatus = "not_ready" | "almost_ready" | "ready";

/** Negotiation chain summary for case command center (aligned with `getNegotiationSnapshotForCase`). */
export type CaseNegotiationSummary = {
  chainStatus: string | null;
  activeVersionNumber: number | null;
  activeVersionStatus: string | null;
  activeIsFinal: boolean;
  previousVersionNumber: number | null;
  diffSummaryLines: string[];
  nextAction: string;
};

export type CaseHealthSnapshot = {
  documentId: string;
  propertyId: string;
  /** Listing ask on file (cents) — for tools that need a price anchor */
  listPriceCents: number;
  propertyTitle: string;
  propertyAddressLine: string;
  score: number;
  status: CaseHealthStatus;
  blockers: CaseHealthBlockerItem[];
  warnings: CaseHealthBlockerItem[];
  primaryNextAction: string;
  secondaryActions: string[];
  signatureReadiness: {
    status: CaseSignatureReadinessStatus;
    checklist: Array<{ id: string; label: string; done: boolean }>;
  };
  documentPanels: {
    sellerDeclaration: CaseDocumentPanelState;
    contract: CaseDocumentPanelState;
    review: CaseDocumentPanelState;
  };
  /** Single source for graph + rules (existing shape) */
  legalSummary: LegalGraphSummary;
  knowledgeRules: KnowledgeRuleEvaluation;
  /** Present when a negotiation chain exists for this listing/case. */
  negotiation?: CaseNegotiationSummary | null;
};

export type CaseTimelineEvent = {
  id: string;
  createdAt: string;
  kind: "audit" | "workflow" | "ai" | "signature";
  title: string;
  detail?: string;
};
