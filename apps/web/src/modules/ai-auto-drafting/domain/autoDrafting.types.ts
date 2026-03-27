import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";

export type SourceRef = {
  chunkId?: string;
  documentTitle: string;
  documentId: string;
  pageNumber: number | null;
  excerpt: string;
  importance?: string;
};

/** Standard output for all auto-drafting operations — reviewable only; never binding. */
export type StandardDraftOutput = {
  documentType: AutoDraftDocumentTypeId;
  sectionKey: string;
  suggestedText: string;
  assumptions: string[];
  missingFacts: string[];
  followUpQuestions: string[];
  confidence: number;
  sourceRefs: SourceRef[];
};

export type AutoDraftFieldSchema = {
  key: string;
  label: string;
  required: boolean;
  inputTypes: Array<"text" | "textarea" | "boolean" | "select">;
  conditional?: { fieldKey: string; equals: string | boolean };
  aiDraftingEnabled: boolean;
};

export type AutoDraftSectionSchema = {
  key: string;
  label: string;
  description: string;
  fields: AutoDraftFieldSchema[];
};

export type AutoDraftTemplateSchema = {
  id: string;
  label: string;
  documentType: AutoDraftDocumentTypeId;
  sections: AutoDraftSectionSchema[];
};
