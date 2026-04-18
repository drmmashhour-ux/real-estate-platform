/**
 * Broker-facing legal knowledge view models (Quebec brokerage / OACIQ-aligned materials).
 * Does not embed statute text in code — content comes from DB `KnowledgeDocument` / `KnowledgeChunk`.
 */

export type LegalMaterialType = "law" | "obligation" | "workflow" | "drafting_guideline";

export type LegalSourceAttribution = {
  source: string;
  page: number | null;
  section: string;
  explanation: string;
};

export type StructuredLegalChunk = {
  id: string;
  sourceName: string;
  pageNumber: number | null;
  sectionTitle: string;
  content: string;
  type: LegalMaterialType;
  score?: number;
};

export type LegalIngestSection = {
  sectionTitle: string;
  pageNumber?: number | null;
  content: string;
};

export type LegalIngestPayload = {
  sourceName: string;
  documentType: "law" | "drafting" | "internal";
  fileUrl: string;
  sections: LegalIngestSection[];
};

export const BROKER_REVIEW_LABEL = "Draft – Broker Review Required" as const;
